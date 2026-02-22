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