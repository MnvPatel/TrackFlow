import { Request, Response } from "express";
import prisma from "../prisma";
import { ProjectStatus } from "@prisma/client";

//ADMIN CREATE PROJECT

interface CreateProjectBody {
  title: string;
  description?: string;
  clientId: string;
  teamMemberIds: string[];
  startDate?: string;
  endDate?: string;
}

export const createProject = async (req: any, res: Response) => {
  try {
    const {
      title,
      description,
      clientId,
      teamMemberIds,
      startDate,
      endDate,
    } = req.body as CreateProjectBody;
    
    if (!title || !clientId) {
      return res.status(400).json({
        message: "Title and clientId are required",
      });
    }

    const client = await prisma.user.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return res.status(400).json({
        message: "Client does not exist",
      });
    }

    if (client.role !== "CLIENT") {
      return res.status(400).json({
        message: "Provided user is not a client",
      });
    }

    if (!client.isActive || !client.isVerified) {
      return res.status(400).json({
        message: "Client account is not active or verified",
      });
    }

    //validate team members - remove duplicates
    const uniqueTeamMemberIds = [...new Set(teamMemberIds)];

    if (uniqueTeamMemberIds.length > 0) {
      const employees = await prisma.user.findMany({
        where: {
          id: { in: uniqueTeamMemberIds },
          role: "EMPLOYEE",
          isActive: true,
        },
      });

      if (employees.length !== uniqueTeamMemberIds.length) {
        return res.status(400).json({
          message:
            "One or more team members are invalid, inactive, or not employees",
        });
      }
    }

    const project = await prisma.project.create({
      data: {
        title,
        description,
        clientId,
        createdById: req.user.id,
        startDate,
        endDate,
        members: {
          create: uniqueTeamMemberIds.map((userId: string) => ({
            userId,
          })),
        },
      },
      include: {
        client: {
          select: { id: true, name: true, email: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: "Project created successfully",
      project,
    });
  } catch (error: any) {
    console.error("Create Project Error:", error);
    return res.status(500).json({
      message: "Failed to create project",
    });
  }
};

//GET PROJECTS - ROLE BASED
export const getProjects = async (req: any, res: Response) => {
  const { id, role } = req.user;

  let whereCondition: any;

  if (role === "ADMIN") {
    whereCondition = {}; // all projects
  } 
  else if (role === "EMPLOYEE") {
    whereCondition = {
      members: {
        some: { userId: id },
      },
    };
  } 
  else if (role === "CLIENT") {
    whereCondition = {
      clientId: id,
    };
  } 
  else {
    return res.sendStatus(403);
  }

  const projects = await prisma.project.findMany({
    where: whereCondition,
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      startDate: true,
      endDate: true,
      client: {
        select: { id: true, name: true, email: true },
      },
      members: {
        select: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
  });

  res.json(projects);
};

//GET PROJECT BY ID
export const getProjectById = async (req: any, res: Response) => {
  const { projectId } = req.params;
  const { id, role } = req.user;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      members: true,
      tasks: true,
      issues: true,
    },
  });

  if (!project) return res.status(404).json({ message: "Project not found" });

  if (
    role === "CLIENT" &&
    project.clientId !== id
  ) {
    return res.sendStatus(403);
  }

  if (
    role === "EMPLOYEE" &&
    !project.members.some((m) => m.userId === id)
  ) {
    return res.sendStatus(403);
  }

  res.json(project);
};

//ADMIN: Update Project Status
export const updateProjectStatus = async (req: Request, res: Response) => {
  const projectId = req.params.projectId as string;
  const { status } = req.body;

  if (!Object.values(ProjectStatus).includes(status)) {
    return res.status(400).json({ message: "Invalid project status" });
  }

  const project = await prisma.project.update({
    where: { id: projectId },
    data: { status },
  });

  res.json({
    message: "Project status updated",
    project,
  });
};

//EDIT PROJECT
export const editProject = async (req: Request, res: Response) => {
  const projectId = req.params.projectId as string;
  const { title, description, startDate, endDate, status } = req.body;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    return res.status(404).json({ message: "Project not found" });
  }

  //Cannot edit completed project
  if (project.status === "COMPLETED") {
    return res.status(400).json({
      message: "Completed project cannot be edited",
    });
  }

  //Validate status enum
  if (status && !Object.values(ProjectStatus).includes(status)) {
    return res.status(400).json({
      message: "Invalid project status",
    });
  }

  const updated = await prisma.project.update({
    where: { id: projectId },
    data: {
      title,
      description,
      startDate,
      endDate,
      status,
    },
  });

  res.json(updated);
};

//DELETE PROJECT
export const deleteProject = async (req: Request, res: Response) => {
  const projectId = req.params.projectId as string;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      tasks: true,
      issues: true,
    },
  });

  if (!project) {
    return res.status(404).json({ message: "Project not found" });
  }

  //If tasks exist => no delete
  if (project.tasks.length > 0) {
    return res.status(400).json({
      message:
        "Project has tasks. Mark project as COMPLETED instead of deleting.",
    });
  }

  //If issues exist => no delete
  if (project.issues.length > 0) {
    return res.status(400).json({
      message:
        "Project has issues. Resolve them before deleting the project.",
    });
  }

  await prisma.project.delete({
    where: { id: projectId },
  });

  res.json({ message: "Project deleted safely" });
};
