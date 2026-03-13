import { Response } from "express";
import prisma from "../prisma";
import { ProjectStatus } from "@prisma/client";
import { deleteCache, getCache, setCache } from "../utils/cache";
import { createBulkNotification, createNotification } from "../services/notification.service";

//ADMIN CREATE PROJECT
interface CreateProjectBody {
  title: string;
  description?: string;
  clientId: string;
  teamMemberIds: string[];
  startDate?: Date;
  endDate?: Date;
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

    if (!client || client.role !== "CLIENT") {
      return res.status(400).json({
        message: "Invalid client",
      });
    }

    if (!client.isActive || !client.isVerified) {
      return res.status(400).json({
        message: "Client account is not active or verified",
      });
    }

    //validate team members - remove duplicates
    const uniqueTeamMemberIds = [...new Set(teamMemberIds || [])];

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
          message: "Invalid team members",
        });
      }
    }

    const start =
      startDate != null && String(startDate).trim() !== ""
        ? new Date(startDate as string | Date)
        : undefined;
    const end =
      endDate != null && String(endDate).trim() !== ""
        ? new Date(endDate as string | Date)
        : undefined;
    if (start !== undefined && isNaN(start.getTime())) {
      return res.status(400).json({ message: "Invalid startDate" });
    }
    if (end !== undefined && isNaN(end.getTime())) {
      return res.status(400).json({ message: "Invalid endDate" });
    }
    if (start !== undefined && end !== undefined && end < start) {
      return res.status(400).json({ message: "endDate must be after startDate" });
    }

    const project = await prisma.project.create({
      data: {
        title,
        description,
        clientId,
        createdById: req.user.id,
        ...(start !== undefined && { startDate: start }),
        ...(end !== undefined && { endDate: end }),
        members: {
          create: uniqueTeamMemberIds.map((userId) => ({
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

    //CACHE INVALIDATION
    await deleteCache([
      "projects:ADMIN",
      `projects:CLIENT:${clientId}`,
      ...uniqueTeamMemberIds.map(
        (id) => `projects:EMPLOYEE:${id}`
      ),
    ]);

    await createNotification({
      userId: clientId,
      title: "Project Created",
      message: `Project "${title}" has been created`,
      entityType: "PROJECT",
      entityId: project.id,
    });

    await createBulkNotification({
      userIds: teamMemberIds,
      title: "Assigned to Project",
      message: `You were added to project "${title}"`,
      entityType: "PROJECT",
      entityId: project.id,
    });

    return res.status(201).json({
      success: true,
      message: "Project created successfully",
      project,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to create project",
    });
  }
};

//GET PROJECTS - ROLE BASED
export const getProjects = async (req: any, res: Response) => {
  const { id, role } = req.user;

  const cacheKey = role === "ADMIN" ? "projects:ADMIN" : `projects:${role}:${id}`;
  
  //check cache
  const cached = await getCache(cacheKey);
  if (cached) {
    return res.json(cached);
  }

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

  await setCache(cacheKey, projects, 300);

  res.json(projects);
};

//GET PROJECT BY ID
export const getProjectById = async (req: any, res: Response) => {
  const { projectId } = req.params;
  const { id, role } = req.user;

  // ADMIN shares one cache key per project so invalidation (e.g. on task create) works
  const cacheKey = role === "ADMIN" ? `project:${projectId}:ADMIN` : `project:${projectId}:${role}:${id}`;

  const cached = await getCache(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },

    include: {
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

      tasks: {
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          deadline: true,
          percentCompleted: true,
          createdAt: true,
          projectId: true,
          assignments: {
            select: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
      },

      issues: {
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
    },
  });

  if (!project) {
    return res.status(404).json({ message: "Project not found" });
  }

  if (role === "CLIENT" && project.client.id !== id) {
    return res.sendStatus(403);
  }

  if (
    role === "EMPLOYEE" &&
    !project.members.some((m) => m.user.id === id)
  ) {
    return res.sendStatus(403);
  }

  await setCache(cacheKey, project, 300);

  res.json(project);
};


//ADMIN: Update Project Status
export const updateProjectStatus = async (req: any, res: Response) => {
  const projectId = req.params.projectId as string;
  const { status } = req.body;

  if (!Object.values(ProjectStatus).includes(status)) {
    return res.status(400).json({ message: "Invalid project status" });
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { members: true },
  });

  if (!project) {
    return res.status(404).json({ message: "Project not found" });
  }

  const updated = await prisma.project.update({
    where: { id: projectId },
    data: { status },
  });

  //CACHE INVALIDATION
  await deleteCache([
    "projects:ADMIN",
    `projects:CLIENT:${project.clientId}`,
    ...project.members.map(
      (m) => `projects:EMPLOYEE:${m.userId}`
    ),

    `project:${projectId}:ADMIN`,
    `project:${projectId}:CLIENT:${project.clientId}`,
    ...project.members.map(
      (m) =>
        `project:${projectId}:EMPLOYEE:${m.userId}`
    ),
  ]);

  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  });

  const memberIds = project.members.map((m) => m.userId);

  let participantIds = [
    project.clientId,
    ...memberIds,
    ...admins.map((a) => a.id),
  ];

  //Remove duplicates
  participantIds = [...new Set(participantIds)];

  //remove the user that is commenting
  participantIds = participantIds.filter(uid => uid !== req.user?.id);

  await createBulkNotification({
    userIds: participantIds,
    title: "Project Status Updated",
    message: `Project "${project.title}" status changed to ${status}`,
    entityType: "PROJECT",
    entityId: projectId,
  });

  res.json({
    message: "Project status updated",
    updated
  });
};

//EDIT PROJECT (including team members)
export const editProject = async (req: any, res: Response) => {
  const projectId = req.params.projectId as string;
  const { title, description, startDate, endDate, status, teamMemberIds } = req.body as {
    title?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    status?: ProjectStatus;
    teamMemberIds?: string[];
  };

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { members: true },
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

  // Parse optional dates (same rules as createProject)
  const start =
    startDate != null && String(startDate).trim() !== ""
      ? new Date(startDate as string | Date)
      : undefined;
  const end =
    endDate != null && String(endDate).trim() !== ""
      ? new Date(endDate as string | Date)
      : undefined;

  if (start !== undefined && isNaN(start.getTime())) {
    return res.status(400).json({ message: "Invalid startDate" });
  }
  if (end !== undefined && isNaN(end.getTime())) {
    return res.status(400).json({ message: "Invalid endDate" });
  }
  if (start !== undefined && end !== undefined && end < start) {
    return res
      .status(400)
      .json({ message: "endDate must be after startDate" });
  }

  // Optional: update team members (employees) – same validation as createProject
  let updatedProject = project;
  if (Array.isArray(teamMemberIds)) {
    // Normalize and remove any empty / null values
    const uniqueTeamMemberIds: string[] = [
      ...new Set(
        teamMemberIds
          .filter((id) => typeof id === "string" && id.trim() !== "")
          .map((id) => id.trim())
      ),
    ];

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
          message: "Invalid team members",
        });
      }
    }

    // Determine which users are being removed from the project team
    const existingMemberIds = project.members.map((m) => m.userId);
    const removedUserIds = existingMemberIds.filter(
      (id) => !uniqueTeamMemberIds.includes(id)
    );

    // If any removed users have APPROVED submissions on tasks in this project, block removal
    if (removedUserIds.length > 0) {
      const blocking = await prisma.workSubmission.findFirst({
        where: {
          submittedById: { in: removedUserIds },
          status: "APPROVED",
          task: {
            projectId,
          },
        },
      });
      if (blocking) {
        return res.status(400).json({
          message:
            "Cannot remove team members who have approved work on this project",
        });
      }
    }

    // Replace project members to match new list
    updatedProject = await prisma.$transaction(async (tx) => {
      // Remove members no longer in the list
      if (uniqueTeamMemberIds.length === 0) {
        // If list is empty, remove all members
        await tx.projectMember.deleteMany({
          where: { projectId },
        });
      } else {
        await tx.projectMember.deleteMany({
          where: {
            projectId,
            userId: { notIn: uniqueTeamMemberIds },
          },
        });
      }

      // Add any new members that don't exist yet
      const existingMembers = await tx.projectMember.findMany({
        where: { projectId },
        select: { userId: true },
      });
      const existingIds = new Set(existingMembers.map((m) => m.userId));

      const toCreate = uniqueTeamMemberIds.filter((id) => !existingIds.has(id));
      if (toCreate.length > 0) {
        await tx.projectMember.createMany({
          data: toCreate.map((userId) => ({ projectId, userId })),
        });
      }

      // Also remove task assignments for users removed from the project (if any)
      if (removedUserIds.length > 0) {
        await tx.taskAssignment.deleteMany({
          where: {
            userId: { in: removedUserIds },
            task: {
              projectId,
            },
          },
        });
      }

      // Update scalar fields on project
      return tx.project.update({
        where: { id: projectId },
        data: {
          title,
          description,
          ...(start !== undefined && { startDate: start }),
          ...(end !== undefined && { endDate: end }),
          status,
        },
        include: { members: true },
      });
    });
  } else {
    updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        title,
        description,
        ...(start !== undefined && { startDate: start }),
        ...(end !== undefined && { endDate: end }),
        status,
      },
      include: { members: true },
    });
  }

  //CACHE INVALIDATION
  const updatedMemberIds = updatedProject.members.map((m) => m.userId);
  const previousMemberIds = project.members.map((m) => m.userId);
  const removedUserIdsGlobal = previousMemberIds.filter(
    (id) => !updatedMemberIds.includes(id)
  );

  await deleteCache([
    "projects:ADMIN",
    `projects:CLIENT:${updatedProject.clientId}`,
    ...updatedMemberIds.map((mId) => `projects:EMPLOYEE:${mId}`),
    ...removedUserIdsGlobal.map((id) => `projects:EMPLOYEE:${id}`),

    `project:${projectId}:ADMIN`,
    `project:${projectId}:CLIENT:${updatedProject.clientId}`,
    ...updatedMemberIds.map(
      (mId) => `project:${projectId}:EMPLOYEE:${mId}`
    ),
    ...removedUserIdsGlobal.map(
      (id) => `project:${projectId}:EMPLOYEE:${id}`
    ),

    // Also clear task caches for removed employees so their dashboards update
    ...removedUserIdsGlobal.map((id) => `tasks:EMPLOYEE:${id}`),
  ]);

  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  });

  const memberIds = updatedProject.members.map((m) => m.userId);
  
  let participantIds = [
    updatedProject.clientId,
    ...memberIds,
    ...admins.map((a) => a.id),
  ];
  
  participantIds = [...new Set(participantIds)];

  participantIds = participantIds.filter(uid => uid !== req.user?.id);

  await createBulkNotification({
    userIds: participantIds,
    title: "Project Updated",
    message: `Project "${project.title}" details were updated`,
    entityType: "PROJECT",
    entityId: projectId,
  });

  res.json(updatedProject);
};

//DELETE PROJECT
export const deleteProject = async (req: any, res: Response) => {
  const projectId = req.params.projectId as string;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      tasks: true,
      issues: true,
      members: true,
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

  await prisma.$transaction(async (tx) => {
    await tx.comment.updateMany({
      where: { projectId },
      data: { parentCommentId: null },
    });
    await tx.comment.deleteMany({ where: { projectId } });
    await tx.milestone.deleteMany({ where: { projectId } });
    await tx.projectMember.deleteMany({ where: { projectId } });
    await tx.project.delete({ where: { id: projectId } });
  });

  //CACHE INVALIDATION
  await deleteCache([
    "projects:ADMIN",
    `projects:CLIENT:${project.clientId}`,
    ...project.members.map(
      (m) => `projects:EMPLOYEE:${m.userId}`
    ),

    `project:${projectId}:ADMIN`,
    `project:${projectId}:CLIENT:${project.clientId}`,
    ...project.members.map(
      (m) =>
        `project:${projectId}:EMPLOYEE:${m.userId}`
    ),
  ]);

  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  });

  const memberIds = project.members.map((m) => m.userId);

  let participantIds = [
    project.clientId,
    ...memberIds,
    ...admins.map((a) => a.id),
  ];

  participantIds = [...new Set(participantIds)];

  participantIds = participantIds.filter(uid => uid !== req.user?.id);

  await createBulkNotification({
    userIds: participantIds,
    title: "Project Deleted",
    message: `Project "${project.title}" has been removed`,
    entityType: "PROJECT",
    entityId: projectId,
  });

  res.json({ message: "Project deleted safely" });
};
