import { Response } from "express";
import prisma from "../prisma";
import { deleteCache } from "../utils/cache";

export const addTaskComment = async (req: any, res: Response) => {
  try {
    const { taskId } = req.params;
    const { text } = req.body;
    const { id, role } = req.user;

    if (!text) {
      return res.status(400).json({
        message: "Comment text is required",
      });
    }

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

    if (role === "EMPLOYEE" && !task.assignments.some((a) => a.userId === id)) {
      return res.sendStatus(403);
    }

    const comment = await prisma.comment.create({
      data: {
        text,
        taskId,
        authorId: id,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    //Cache Invalidation
    const assignedUserIds = task.assignments.map((a) => a.userId);

    await deleteCache([
      `taskComments:${taskId}`,

      "tasks:ADMIN",
      `tasks:CLIENT:${task.project.clientId}`,
      ...assignedUserIds.map((id) => `tasks:EMPLOYEE:${id}`),

      `task:${taskId}:ADMIN`,
      `task:${taskId}:CLIENT:${task.project.clientId}`,
      ...assignedUserIds.map((id) => `task:${taskId}:EMPLOYEE:${id}`),

      "projects:ADMIN",
      `projects:CLIENT:${task.project.clientId}`,
      ...assignedUserIds.map((id) => `projects:EMPLOYEE:${id}`),

      `project:${task.projectId}:ADMIN`,
      `project:${task.projectId}:CLIENT:${task.project.clientId}`,
      ...assignedUserIds.map((id) => `project:${task.projectId}:EMPLOYEE:${id}`)
    ]);

    return res.status(201).json({
      success: true,
      message: "Comment added successfully",
      comment,
    });
  } catch (error) {
    console.error("Add Task Comment Error:", error);
    return res.status(500).json({
      message: "Failed to add comment",
    });
  }
};
