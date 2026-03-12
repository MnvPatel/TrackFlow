import { Request, Response } from "express";
import prisma from "../prisma";
import { TaskStatus } from "@prisma/client";
import { deleteCache, getCache, setCache } from "../utils/cache";
import { createBulkNotification } from "../services/notification.service";

interface CreateTaskBody {
  title: string;
  description?: string;
  projectId: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  deadline?: string;
  assigneeIds: string[];
}

export const createTask = async (req: any, res: Response) => {
  try {
    const {
      title,
      description,
      projectId,
      priority,
      deadline,
      assigneeIds,
    } = req.body as CreateTaskBody;

    // 1. Validate project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: true },
    });

    if (!project) {
      return res.status(400).json({ message: "Project not found" });
    }

    // 2. Ensure assignees are project members
    const projectMemberIds = project.members.map((m) => m.userId);

    const invalidAssignees = assigneeIds.filter(
      (id) => !projectMemberIds.includes(id)
    );

    if (invalidAssignees.length > 0) {
      return res.status(400).json({
        message: "Some assignees are not part of the project team",
      });
    }

    const deadlineDate =
      deadline != null && String(deadline).trim() !== ""
        ? new Date(deadline as string)
        : undefined;
    if (deadlineDate !== undefined && isNaN(deadlineDate.getTime())) {
      return res.status(400).json({ message: "Invalid deadline" });
    }

    // 3. Create task with assignments
    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority,
        ...(deadlineDate !== undefined && { deadline: deadlineDate }),
        projectId,
        createdById: req.user.id,
        assignments: {
          create: assigneeIds.map((userId) => ({
            userId,
          })),
        },
      },
      include: {
        assignments: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    //CACHE INVALIDATION
    await deleteCache([
      "tasks:ADMIN",
      `tasks:CLIENT:${project.clientId}`,
      ...assigneeIds.map(id => `tasks:EMPLOYEE:${id}`),

      `project:${projectId}:ADMIN`,
      `project:${projectId}:CLIENT:${project.clientId}`,
      ...assigneeIds.map(id => `project:${projectId}:EMPLOYEE:${id}`)
    ]);

    await createBulkNotification({
      userIds: assigneeIds,
      title: "New Task Assigned",
      message: `You were assigned task "${title}"`,
      entityType: "TASK",
      entityId: task.id,
    });

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: "Failed to create task" });
  }
};

//GET TASKS - ROLE BASED
export const getTasks = async (req: any, res: Response) => {
  const { id, role } = req.user;

  const cacheKey = role === "ADMIN" ? "tasks:ADMIN" : `tasks:${role}:${id}`;
    
  //check cache
  const cached = await getCache(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  let whereCondition: any;

  if (role === "ADMIN") {
    whereCondition = {};
  } 
  else if (role === "EMPLOYEE") {
    whereCondition = {
      assignments: {
        some: { userId: id },
      },
    };
  } 
  else if (role === "CLIENT") {
    whereCondition = {
      project: {
        clientId: id,
      },
    };
  } 
  else {
    return res.sendStatus(403);
  }

  const tasks = await prisma.task.findMany({
    where: whereCondition,

    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      deadline: true,
      percentCompleted: true,
      createdAt: true,
      projectId: true,

      project: {
        select: {
          id: true,
          title: true,
        },
      },

      assignments: {
        select: {
          id: true,
          userId: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  await setCache(cacheKey, tasks, 300);

  res.json(tasks);
};

//GET TASKS FOR A SPECIFIC PROJECT (no cache, always fresh)
export const getProjectTasks = async (req: any, res: Response) => {
  const { projectId } = req.params as { projectId: string };
  const { id, role } = req.user;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { members: true },
  });

  if (!project) {
    return res.status(404).json({ message: "Project not found" });
  }

  // RBAC:
  // - ADMIN: can see all project tasks
  // - CLIENT: only for their own projects
  // - EMPLOYEE: only if they are a member of the project
  if (role === "CLIENT" && project.clientId !== id) {
    return res.sendStatus(403);
  }

  if (
    role === "EMPLOYEE" &&
    !project.members.some((m) => m.userId === id)
  ) {
    return res.sendStatus(403);
  }

  const tasks = await prisma.task.findMany({
    where: { projectId },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      deadline: true,
      percentCompleted: true,
      createdAt: true,
      projectId: true,
      project: {
        select: {
          id: true,
          title: true,
        },
      },
      assignments: {
        select: {
          id: true,
          userId: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return res.json(tasks);
};

//GET TASK BY ID
export const getTaskById = async (req: any, res: Response) => {
  const { taskId } = req.params;
  const { id, role } = req.user;

  const cacheKey = `task:${taskId}:${role}:${id}`;

  const cached = await getCache(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      deadline: true,
      percentCompleted: true,
      project: {
        select: {
          id: true,
          title: true,
          clientId: true, // needed for RBAC check
        },
      },

      assignments: {
        select: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      comments: true,
      submissions: true,
    },
  });

  if (!task) {
    return res.status(404).json({ message: "Task not found" });
  }

  //RBAC checks 
  if (
    role === "EMPLOYEE" &&
    !task.assignments.some((a) => a.user.id === id)
  ) {
    return res.sendStatus(403);
  }

  if (role === "CLIENT" && task.project.clientId !== id) {
    return res.sendStatus(403);
  }

  await setCache(cacheKey, task, 300);
  
  res.json(task);
};

//ADMIN: Update Task Status; EMPLOYEE: may set assigned task from PENDING to IN_PROGRESS only
export const updateTaskStatus = async (req: any, res: Response) => {
  const taskId = req.params.taskId as string;
  const { status } = req.body;
  const { id: userId, role } = req.user;

  if (!Object.values(TaskStatus).includes(status)) {
    return res.status(400).json({ message: "Invalid task status" });
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: true,
      assignments: true,
    },
  });

  if (!task) {
    return res.status(404).json({ message: "Task not found" });
  }

  if (role === "EMPLOYEE") {
    const isAssigned = task.assignments.some((a) => a.userId === userId);
    if (!isAssigned) {
      return res.status(403).json({ message: "You are not assigned to this task" });
    }
    if (task.status !== "PENDING" || status !== "IN_PROGRESS") {
      return res.status(403).json({
        message: "As an employee you can only start a task (set status to IN_PROGRESS when it is PENDING)",
      });
    }
  }

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: { status },
  });

  const assignedUserIds = task.assignments.map(a => a.userId);

  //CACHE INVALIDATION
  await deleteCache([
    "tasks:ADMIN",
    `tasks:CLIENT:${task.project.clientId}`,
    ...assignedUserIds.map(id => `tasks:EMPLOYEE:${id}`),

    `task:${taskId}:ADMIN`,
    `task:${taskId}:CLIENT:${task.project.clientId}`,
    ...assignedUserIds.map(id => `task:${taskId}:EMPLOYEE:${id}`),

    `project:${task.projectId}:ADMIN`,
    `project:${task.projectId}:CLIENT:${task.project.clientId}`,
    ...assignedUserIds.map(id => `project:${task.projectId}:EMPLOYEE:${id}`)
  ]);

  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  });

  let participantIds = [
    task.project.clientId,
    ...assignedUserIds,
    ...admins.map(a => a.id),
  ];

  // remove duplicates
  participantIds = [...new Set(participantIds)];

  // remove actor
  participantIds = participantIds.filter(uid => uid !== req.user?.id);

  await createBulkNotification({
    userIds: participantIds,
    title: "Task Status Updated",
    message: `Task "${task.title}" status changed to ${status}`,
    entityType: "TASK",
    entityId: taskId,
  });

  res.json({
    message: "Task status updated",
    updated,
  });
};

//EDIT TASK
const allowedTransitions: Record<string, string[]> = {
  PENDING: ["IN_PROGRESS"],
  IN_PROGRESS: ["SUBMITTED"],
  SUBMITTED: ["APPROVED", "REJECTED"],
  REJECTED: ["IN_PROGRESS"],
  APPROVED: [],
};

export const editTask = async (req: any, res: Response) => {
  const taskId = req.params.taskId as string;
  const { title, description, priority, deadline, status } = req.body;

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: true,
      assignments: true,
    },
  });

  if (!task) {
    return res.status(404).json({ message: "Task not found" });
  }

  //Cannot edit approved task
  if (task.status === "APPROVED") {
    return res.status(400).json({
      message: "Approved task cannot be edited",
    });
  }

  //Validate enum
  if (status && !Object.values(TaskStatus).includes(status)) {
    return res.status(400).json({
      message: "Invalid task status",
    });
  }

  //Validate transition
  if (status && !allowedTransitions[task.status].includes(status)) {
    return res.status(400).json({
      message: `Cannot change task status from ${task.status} to ${status}`,
    });
  }

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: {
      title,
      description,
      priority,
      deadline,
      status,
    },
  });

  const assignedUserIds = task!.assignments.map(a => a.userId);

  //CACHE INVALIDATION
  await deleteCache([
    "tasks:ADMIN",
    `tasks:CLIENT:${task!.project.clientId}`,
    ...assignedUserIds.map(id => `tasks:EMPLOYEE:${id}`),

    `task:${taskId}:ADMIN`,
    `task:${taskId}:CLIENT:${task!.project.clientId}`,
    ...assignedUserIds.map(id => `task:${taskId}:EMPLOYEE:${id}`),

    `project:${task!.projectId}:ADMIN`,
    `project:${task!.projectId}:CLIENT:${task!.project.clientId}`,
    ...assignedUserIds.map(id => `project:${task!.projectId}:EMPLOYEE:${id}`)
  ]);

  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  });

  let participantIds = [
    task.project.clientId,
    ...assignedUserIds,
    ...admins.map(a => a.id),
  ];

  participantIds = [...new Set(participantIds)];

  participantIds = participantIds.filter(uid => uid !== req.user?.id);

  await createBulkNotification({
    userIds: participantIds,
    title: "Task Updated",
    message: `Task "${task.title}" was updated`,
    entityType: "TASK",
    entityId: taskId,
  });

  res.json(updated);
};

//DELETE TASK
export const deleteTask = async (req: any, res: Response) => {
  const taskId = req.params.taskId as string;

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      submissions: true,
      project: true,
      assignments: true,
    },
  });

  if (!task) {
    return res.status(404).json({ message: "Task not found" });
  }

  //If submission exists => block delete
  if (task.submissions.length > 0) {
    return res.status(400).json({
      message:
        "Task has work submissions. Cannot delete task.",
    });
  }

  //If task is submitted/approved => block delete
  if (["SUBMITTED", "APPROVED"].includes(task.status)) {
    return res.status(400).json({
      message: "Cannot delete task after submission or approval",
    });
  }

  await prisma.$transaction(async (tx) => {
    await tx.comment.updateMany({
      where: { taskId },
      data: { parentCommentId: null },
    });
    await tx.comment.deleteMany({ where: { taskId } });
    await tx.taskAssignment.deleteMany({ where: { taskId } });
    await tx.task.delete({ where: { id: taskId } });
  });

  const assignedUserIds = task.assignments.map(a => a.userId);

  // 🔥 CACHE INVALIDATION
  await deleteCache([
    "tasks:ADMIN",
    `tasks:CLIENT:${task.project.clientId}`,
    ...assignedUserIds.map(id => `tasks:EMPLOYEE:${id}`),

    `task:${taskId}:ADMIN`,
    `task:${taskId}:CLIENT:${task.project.clientId}`,
    ...assignedUserIds.map(id => `task:${taskId}:EMPLOYEE:${id}`),

    `project:${task.projectId}:ADMIN`,
    `project:${task.projectId}:CLIENT:${task.project.clientId}`,
    ...assignedUserIds.map(id => `project:${task.projectId}:EMPLOYEE:${id}`)
  ]);

  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  });

  let participantIds = [
    task.project.clientId,
    ...assignedUserIds,
    ...admins.map(a => a.id),
  ];

  participantIds = [...new Set(participantIds)];
  
  participantIds = participantIds.filter(uid => uid !== req.user?.id);

  await createBulkNotification({
    userIds: participantIds,
    title: "Task Deleted",
    message: `Task "${task.title}" has been removed`,
    entityType: "TASK",
    entityId: taskId,
  });

  res.json({ message: "Task deleted safely" });
};
