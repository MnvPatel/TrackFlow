import { Request, Response } from "express";
import prisma from "../prisma";
import { TaskStatus } from "@prisma/client";

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

    // 3. Create task with assignments
    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority,
        deadline,
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

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: "Failed to create task" });
  }
};

//GET TASKS - ROLE BASED
export const getTasks = async (req: any, res: Response) => {
  const { id, role } = req.user;

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

      project: {
        select: {
          id: true,
          title: true,
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
    },
  });

  res.json(tasks);
};

//GET TASK BY ID
export const getTaskById = async (req: any, res: Response) => {
  const { taskId } = req.params;
  const { id, role } = req.user;

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      deadline: true,

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

  res.json(task);
};

//ADMIN: Update Task Status
export const updateTaskStatus = async (req: Request, res: Response) => {
  const taskId = req.params.taskId as string;
  const { status } = req.body;

  if (!Object.values(TaskStatus).includes(status)) {
    return res.status(400).json({ message: "Invalid task status" });
  }

  const task = await prisma.task.update({
    where: { id: taskId },
    data: { status },
  });

  res.json({
    message: "Task status updated",
    task,
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

export const editTask = async (req: Request, res: Response) => {
  const taskId = req.params.taskId as string;
  const { title, description, priority, deadline, status } = req.body;

  const task = await prisma.task.findUnique({
    where: { id: taskId },
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

  res.json(updated);
};
