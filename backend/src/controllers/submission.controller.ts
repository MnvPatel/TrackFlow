import { Response } from "express";
import prisma from "../prisma";
import { deleteCache } from "../utils/cache";

export const submitWork = async (req: any, res: Response) => {
  try {
    const { taskId } = req.params;
    const { description, percentReported, media = [] } = req.body;
    const employeeId = req.user.id;

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

    if (percentReported < 0 || percentReported > 100) {
      return res.status(400).json({
        message: "Percent must be between 0 and 100",
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
          create: media.map((m: any) => ({
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

    //Cache Invalidation
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
    ]);

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

    const approvedUserIds = approvedSubmissions.map(
      (s) => s.submittedById
    );

    const allApproved = assignedUserIds.every((id) =>
      approvedUserIds.includes(id)
    );

    await prisma.task.update({
      where: { id: task.id },
      data: {
        percentCompleted: taskPercent,
        status: allApproved
          ? "APPROVED"
          : "IN_PROGRESS",
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

    //Cache Invalidation
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
    ]);

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

    //Cache Invalidation
    const assignedUserIds = task.assignments.map(
      (a) => a.userId
    );

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
    ]);

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
