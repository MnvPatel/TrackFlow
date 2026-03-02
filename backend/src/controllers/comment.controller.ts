import { Response } from "express";
import prisma from "../prisma";
import { deleteCache, getCache, setCache } from "../utils/cache";

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
      ...assignedUserIds.map(
        (id) => `project:${task.projectId}:EMPLOYEE:${id}`,
      ),
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

export const getTaskComments = async (req: any, res: Response) => {
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

    if (role === "EMPLOYEE" && !task.assignments.some((a) => a.userId === id)) {
      return res.sendStatus(403);
    }

    const cacheKey = `taskComments:${taskId}:${role}:${id}`;

    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const comments = await prisma.comment.findMany({
      where: {
        taskId,
        parentCommentId: null,
      },
      select: {
        id: true,
        text: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        replies: {
          select: {
            id: true,
            text: true,
            createdAt: true,
            author: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    await setCache(cacheKey, comments, 300);

    return res.json(comments);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to fetch comments",
    });
  }
};

export const addProjectComment = async (req: any, res: Response) => {
  try {
    const { projectId } = req.params;
    const { text } = req.body;
    const { id, role } = req.user;

    if (!text) {
      return res.status(400).json({
        message: "Comment text is required",
      });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: true,
      },
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    if (role === "CLIENT") {
      return res.sendStatus(403);
    }

    if (role === "EMPLOYEE" && !project.members.some((m) => m.userId === id)) {
      return res.sendStatus(403);
    }

    const comment = await prisma.comment.create({
      data: {
        text,
        projectId,
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
    const memberIds = project.members.map((m) => m.userId);

    await deleteCache([
      `projectComments:${projectId}`,

      "projects:ADMIN",
      ...memberIds.map((id) => `projects:EMPLOYEE:${id}`),

      `project:${projectId}:ADMIN`,
      ...memberIds.map((id) => `project:${projectId}:EMPLOYEE:${id}`),
    ]);

    return res.status(201).json({
      success: true,
      message: "Internal project comment added",
      comment,
    });
  } catch (error) {
    console.error("Add Project Comment Error:", error);
    return res.status(500).json({
      message: "Failed to add comment",
    });
  }
};

export const getProjectComments = async (req: any, res: Response) => {
  try {
    const { projectId } = req.params;
    const { id, role } = req.user;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: true,
      },
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    if (role === "CLIENT") {
      return res.sendStatus(403);
    }

    if (role === "EMPLOYEE" && !project.members.some((m) => m.userId === id)) {
      return res.sendStatus(403);
    }

    const cacheKey = `projectComments:${projectId}:${role}:${id}`;

    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const comments = await prisma.comment.findMany({
      where: {
        projectId,
        parentCommentId: null,
      },
      select: {
        id: true,
        text: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        replies: {
          select: {
            id: true,
            text: true,
            createdAt: true,
            author: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    await setCache(cacheKey, comments, 300);

    return res.json(comments);
  } catch (error) {
    console.error("Get Project Comments Error:", error);
    return res.status(500).json({
      message: "Failed to fetch comments",
    });
  }
};

export const replyToComment = async (req: any, res: Response) => {
  try {
    const { commentId } = req.params;
    const { text } = req.body;
    const { id, role } = req.user;

    if (!text) {
      return res.status(400).json({
        message: "Reply text is required",
      });
    }

    const parentComment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        task: {
          include: {
            assignments: true,
            project: true,
          },
        },
        project: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!parentComment) {
      return res.status(404).json({
        message: "Parent comment not found",
      });
    }

    let projectId: string | null = null;
    let taskId: string | null = null;
    let assignedUserIds: string[] = [];
    let memberIds: string[] = [];

    //Task Comment Reply
    if (parentComment.task) {
      const task = parentComment.task;
      projectId = task.projectId;
      taskId = task.id;
      assignedUserIds = task.assignments.map((a) => a.userId);

      if (role === "CLIENT" && task.project.clientId !== id) {
        return res.sendStatus(403);
      }

      if (role === "EMPLOYEE" && !assignedUserIds.includes(id)) {
        return res.sendStatus(403);
      }
    }

    //Project Comment Reply
    else if (parentComment.project) {
      const project = parentComment.project;
      projectId = project.id;
      memberIds = project.members.map((m) => m.userId);

      if (role === "CLIENT") {
        return res.sendStatus(403);
      }

      if (role === "EMPLOYEE" && !memberIds.includes(id)) {
        return res.sendStatus(403);
      }
    } else {
      return res.status(400).json({
        message: "Invalid comment context",
      });
    }

    const reply = await prisma.comment.create({
      data: {
        text,
        parentCommentId: commentId,
        taskId,
        projectId,
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
    const cacheKeys: string[] = [];

    if (taskId) {
      cacheKeys.push(
        `taskComments:${taskId}`,
        `taskComments:${taskId}:ADMIN`,
        ...assignedUserIds.map(
          (uid) => `taskComments:${taskId}:EMPLOYEE:${uid}`,
        ),
      );
    }

    if (projectId) {
      cacheKeys.push(
        `projectComments:${projectId}`,
        `projectComments:${projectId}:ADMIN`,
        ...memberIds.map(
          (uid) => `projectComments:${projectId}:EMPLOYEE:${uid}`,
        ),
      );
    }

    await deleteCache(cacheKeys);

    return res.status(201).json({
      success: true,
      message: "Reply added successfully",
      reply,
    });
  } catch (error) {
    console.error("Reply Comment Error:", error);
    return res.status(500).json({
      message: "Failed to reply to comment",
    });
  }
};
