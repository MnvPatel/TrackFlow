import { Response } from "express";
import prisma from "../prisma";
import { deleteCache, getCache, setCache } from "../utils/cache";
import { createBulkNotification, createNotification } from "../services/notification.service";
import { uploadToCloudinary } from "../utils/cloudinary";

export const submitWork = async (req: any, res: Response) => {
  try {
    const { taskId } = req.params;
    const employeeId = req.user.id;

    // Support both JSON body and multipart (multer puts text in req.body)
    let description: string =
      typeof req.body?.description === "string"
        ? req.body.description.trim()
        : "";
    let percentReported: number =
      typeof req.body?.percentReported === "number"
        ? req.body.percentReported
        : Number(req.body?.percentReported);

    if (!description) {
      return res.status(400).json({ message: "Description is required" });
    }
    if (Number.isNaN(percentReported) || percentReported < 0 || percentReported > 100) {
      return res.status(400).json({
        message: "Percent must be a number between 0 and 100",
      });
    }

    let media: { mediaUrl: string; mediaType: "IMAGE" | "VIDEO" }[] = [];

    // If files were uploaded (multipart), upload to Cloudinary
    const files = req.files?.media;
    if (Array.isArray(files) && files.length > 0) {
      for (const file of files) {
        if (file.buffer && file.mimetype) {
          const result = await uploadToCloudinary(
            file.buffer,
            file.mimetype,
            "task_submissions"
          );
          media.push(result);
        }
      }
    } else if (Array.isArray(req.body?.media)) {
      // JSON body: use provided media URLs (e.g. from a separate upload step)
      media = req.body.media
        .filter((m: any) => m?.mediaUrl && (m?.mediaType === "IMAGE" || m?.mediaType === "VIDEO"))
        .map((m: any) => ({ mediaUrl: m.mediaUrl, mediaType: m.mediaType }));
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignments: true,
        project: true,
      },
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const isAssigned = task.assignments.some(
      (a) => a.userId === employeeId
    );

    if (!isAssigned) {
      return res
        .status(403)
        .json({ message: "You are not assigned to this task" });
    }

    if (task.status === "APPROVED") {
      return res.status(400).json({
        message: "Cannot submit work on approved task",
      });
    }

    if (task.status === "PENDING") {
      return res.status(400).json({
        message: "Task must be in progress before submission",
      });
    }

    const lastSubmission = await prisma.workSubmission.findFirst({
      where: {
        taskId,
        submittedById: employeeId,
      },
      orderBy: {
        versionNumber: "desc",
      },
    });

    const nextVersion = lastSubmission
      ? lastSubmission.versionNumber + 1
      : 1;

    const submission = await prisma.workSubmission.create({
      data: {
        description,
        percentReported,
        versionNumber: nextVersion,
        taskId,
        submittedById: employeeId,
        status: "SUBMITTED",
        media: {
          create: media.map((m) => ({
            mediaUrl: m.mediaUrl,
            mediaType: m.mediaType,
          })),
        },
      },
      include: {
        media: true,
      },
    });

    await prisma.task.update({
      where: { id: taskId },
      data: { status: "SUBMITTED" },
    });

    const admins = await prisma.user.findMany({
      where: {
        role: "ADMIN",
      },
      select: { id: true },
    });

    //Cache Invalidation (including submissions list so getSubmissions returns all)
    const assignedUserIds = task.assignments.map(
      (a) => a.userId
    );

    await deleteCache([
      "tasks:ADMIN",
      `tasks:CLIENT:${task.project.clientId}`,
      ...assignedUserIds.map(
        (id) => `tasks:EMPLOYEE:${id}`
      ),

      `task:${taskId}:ADMIN`,
      `task:${taskId}:CLIENT:${task.project.clientId}`,
      ...assignedUserIds.map(
        (id) => `task:${taskId}:EMPLOYEE:${id}`
      ),

      `project:${task.projectId}:ADMIN`,
      `project:${task.projectId}:CLIENT:${task.project.clientId}`,
      ...assignedUserIds.map(
        (id) =>
          `project:${task.projectId}:EMPLOYEE:${id}`
      ),

      `submissions:${taskId}:CLIENT:${task.project.clientId}`,
      ...assignedUserIds.map((id) => `submissions:${taskId}:EMPLOYEE:${id}`),
      ...admins.map((a) => `submissions:${taskId}:ADMIN:${a.id}`),
    ]);

    await createNotification({
      userId: task.project.clientId,
      title: "Work Submitted",
      message: `New work submitted for task "${task.title}"`,
      entityType: "SUBMISSION",
      entityId: submission.id,
    });

    await createBulkNotification({
      userIds: admins.map(a => a.id),
      title: "Work Submitted",
      message: `Employee submitted work for task "${task.title}"`,
      entityType: "SUBMISSION",
      entityId: submission.id,
    });

    return res.status(201).json({
      success: true,
      message: "Work submitted successfully",
      submission,
    });
  } catch (error) {
    console.error("Submit Work Error:", error);
    return res.status(500).json({
      message: "Failed to submit work",
    });
  }
};

export const approveSubmission = async (req: any, res: Response) => {
  try {
    const { submissionId } = req.params;

    const submission = await prisma.workSubmission.findUnique({
      where: { id: submissionId },
      include: {
        task: {
          include: {
            assignments: true,
            project: true,
            submissions: true,
          },
        },
      },
    });

    if (!submission) {
      return res.status(404).json({
        message: "Submission not found",
      });
    }

    const task = submission.task;
    const project = task.project;
    
    await prisma.workSubmission.update({
      where: { id: submissionId },
      data: { status: "APPROVED" },
    });

    const approvedSubmissions =
      await prisma.workSubmission.findMany({
        where: {
          taskId: task.id,
          status: "APPROVED",
        },
      });

    let taskPercent = approvedSubmissions.reduce(
      (sum, s) => sum + s.percentReported,
      0
    );

    if (taskPercent > 100) taskPercent = 100;

    const assignedUserIds = task.assignments.map(
      (a) => a.userId
    );

    // Update task percentCompleted only; do NOT set task status to APPROVED.
    // Task stays IN_PROGRESS so multiple employees can keep submitting.
    // Only admin can set task status to APPROVED (completed) to stop submissions.
    await prisma.task.update({
      where: { id: task.id },
      data: {
        percentCompleted: taskPercent,
        status: "IN_PROGRESS",
      },
    });
    
    const tasks = await prisma.task.findMany({
      where: { projectId: project.id },
    });

    const projectPercent =
      tasks.reduce(
        (sum, t) => sum + t.percentCompleted,
        0
      ) / tasks.length;

    await prisma.project.update({
      where: { id: project.id },
      data: {
        percentCompleted: Math.floor(
          projectPercent
        ),
      },
    });

    //Cache Invalidation (including submissions list cache so UI refreshes)
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });
    await deleteCache([
      "tasks:ADMIN",
      `tasks:CLIENT:${project.clientId}`,
      ...assignedUserIds.map(
        (id) => `tasks:EMPLOYEE:${id}`
      ),

      `task:${task.id}:ADMIN`,
      `task:${task.id}:CLIENT:${project.clientId}`,
      ...assignedUserIds.map(
        (id) => `task:${task.id}:EMPLOYEE:${id}`
      ),

      `project:${project.id}:ADMIN`,
      `project:${project.id}:CLIENT:${project.clientId}`,
      ...assignedUserIds.map(
        (id) =>
          `project:${project.id}:EMPLOYEE:${id}`
      ),

      `submissions:${task.id}:CLIENT:${project.clientId}`,
      ...assignedUserIds.map((id) => `submissions:${task.id}:EMPLOYEE:${id}`),
      ...admins.map((a) => `submissions:${task.id}:ADMIN:${a.id}`),
    ]);

    await createNotification({
      userId: submission.submittedById,
      title: "Submission Approved",
      message: `Your submission for task "${task.title}" was approved`,
      entityType: "SUBMISSION",
      entityId: submission.id,
    });

    return res.json({
      success: true,
      message: "Submission approved",
    });
  } catch (error) {
    console.error("Approve Error:", error);
    return res.status(500).json({
      message: "Approval failed",
    });
  }
};

export const rejectSubmission = async (req: any, res: Response) => {
  try {
    const { submissionId } = req.params;

    const submission = await prisma.workSubmission.findUnique({
      where: { id: submissionId },
      include: {
        task: {
          include: {
            assignments: true,
            project: true,
          },
        },
      },
    });

    if (!submission) {
      return res.status(404).json({
        message: "Submission not found",
      });
    }

    const task = submission.task;
    const project = task.project;
    
    await prisma.workSubmission.update({
      where: { id: submissionId },
      data: { status: "REJECTED" },
    });

    const approvedSubmissions =
      await prisma.workSubmission.findMany({
        where: {
          taskId: task.id,
          status: "APPROVED",
        },
      });

    let taskPercent = approvedSubmissions.reduce(
      (sum, s) => sum + s.percentReported,
      0
    );

    if (taskPercent > 100) taskPercent = 100;

    await prisma.task.update({
      where: { id: task.id },
      data: {
        percentCompleted: taskPercent,
        status: "REJECTED",
      },
    });

    const tasks = await prisma.task.findMany({
      where: { projectId: project.id },
    });

    const projectPercent =
      tasks.reduce(
        (sum, t) => sum + t.percentCompleted,
        0
      ) / tasks.length;

    await prisma.project.update({
      where: { id: project.id },
      data: {
        percentCompleted: Math.floor(projectPercent),
      },
    });

    //Cache Invalidation (including submissions list cache so UI refreshes)
    const assignedUserIdsReject = task.assignments.map(
      (a) => a.userId
    );
    const adminsReject = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });
    await deleteCache([
      "tasks:ADMIN",
      `tasks:CLIENT:${project.clientId}`,
      ...assignedUserIdsReject.map(
        (id) => `tasks:EMPLOYEE:${id}`
      ),

      `task:${task.id}:ADMIN`,
      `task:${task.id}:CLIENT:${project.clientId}`,
      ...assignedUserIdsReject.map(
        (id) => `task:${task.id}:EMPLOYEE:${id}`
      ),

      `project:${project.id}:ADMIN`,
      `project:${project.id}:CLIENT:${project.clientId}`,
      ...assignedUserIdsReject.map(
        (id) =>
          `project:${project.id}:EMPLOYEE:${id}`
      ),

      `submissions:${task.id}:CLIENT:${project.clientId}`,
      ...assignedUserIdsReject.map((id) => `submissions:${task.id}:EMPLOYEE:${id}`),
      ...adminsReject.map((a) => `submissions:${task.id}:ADMIN:${a.id}`),
    ]);

    await createNotification({
      userId: submission.submittedById,
      title: "Submission Rejected",
      message: `Your submission for task "${task.title}" was rejected`,
      entityType: "SUBMISSION",
      entityId: submission.id,
    });

    return res.json({
      success: true,
      message: "Submission rejected",
    });
  } catch (error) {
    console.error("Reject Error:", error);
    return res.status(500).json({
      message: "Rejection failed",
    });
  }
};

export const getSubmissions = async (req: any, res: Response) => {
  try {
    const { taskId } = req.params;
    const { id, role } = req.user;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignments: true,
        project: true,
      },
    });

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }
    
    if (role === "CLIENT" && task.project.clientId !== id) {
      return res.sendStatus(403);
    }

    // EMPLOYEE → must be assigned to task
    if (
      role === "EMPLOYEE" &&
      !task.assignments.some((a) => a.userId === id)
    ) {
      return res.sendStatus(403);
    }

    const cacheKey = `submissions:${taskId}:${role}:${id}`;

    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    let whereCondition: any = { taskId };

    if (role === "CLIENT") {
      whereCondition.status = "APPROVED";
    }

    const submissions =
      await prisma.workSubmission.findMany({
        where: whereCondition,
        select: {
          id: true,
          description: true,
          percentReported: true,
          versionNumber: true,
          status: true,
          createdAt: true,
          submittedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          media: {
            select: {
              mediaUrl: true,
              mediaType: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

    //Cache Response
    await setCache(cacheKey, submissions, 300);

    return res.json(submissions);
  } catch (error) {
    console.error("Get Submissions Error:", error);
    return res.status(500).json({
      message: "Failed to fetch submissions",
    });
  }
};
