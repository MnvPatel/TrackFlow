import { Request, Response } from "express";
import prisma from "../prisma";

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
