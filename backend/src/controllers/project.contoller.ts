import { Request, Response } from "express";
import prisma from "../prisma";

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

