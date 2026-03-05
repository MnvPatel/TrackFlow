import { Request, Response } from "express";
import prisma from "../prisma";
import { deleteCache, getCache, setCache } from "../utils/cache";
import { createBulkNotification, createNotification } from "../services/notification.service";

export const createIssue = async (req: any, res: Response) => {
  try {
    const { projectId } = req.params;
    const { title, description } = req.body;
    const { id, role } = req.user;

    if (role !== "CLIENT") {
      return res.sendStatus(403);
    }

    if (!title) {
      return res.status(400).json({
        message: "Issue title is required",
      });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    if (project.clientId !== id) {
      return res.sendStatus(403);
    }

    const issue = await prisma.issue.create({
      data: {
        title,
        description,
        projectId,
        createdById: id,
        status: "OPEN",
      },
    });

    //Cache invalidation
    await deleteCache([`issues:${projectId}:*`, `project:${projectId}:*`]);

    const admins = await prisma.user.findMany({
      where: {
        role: "ADMIN",
      },
      select: { id: true },
    });

    await createBulkNotification({
      userIds: admins.map(a => a.id),
      title: "New Issue Raised",
      message: `Client reported issue: "${title}"`,
      entityType: "ISSUE",
      entityId: issue.id,
    });

    return res.status(201).json({
      success: true,
      message: "Issue created",
      issue,
    });
  } catch (error) {
    console.error("Create Issue Error:", error);
    return res.status(500).json({
      message: "Failed to create issue",
    });
  }
};

export const getProjectIssues = async (req: any, res: Response) => {
  try {
    const { projectId } = req.params;
    const { id, role } = req.user;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    if (role === "CLIENT" && project.clientId !== id) {
      return res.sendStatus(403);
    }

    if (role !== "ADMIN" && role !== "CLIENT") {
      return res.sendStatus(403);
    }

    const cacheKey = `issues:${projectId}:${role}:${id}`;

    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const issues = await prisma.issue.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    });

    await setCache(cacheKey, issues, 300);

    return res.json(issues);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to fetch issues",
    });
  }
};

export const getIssueById = async (req: any, res: Response) => {
  try {
    const { issueId } = req.params;
    const { id, role } = req.user;

    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
      include: {
        project: true,
        convertedTask: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });

    if (!issue) {
      return res.status(404).json({
        message: "Issue not found",
      });
    }

    if (role === "CLIENT" && issue.project.clientId !== id) {
      return res.sendStatus(403);
    }

    if (role !== "ADMIN" && role !== "CLIENT") {
      return res.sendStatus(403);
    }

    const cacheKey = `issue:${issueId}:${role}:${id}`;

    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    await setCache(cacheKey, issue, 300);

    return res.json(issue);
  } catch (error) {
    console.error("Get Issue By Id Error:", error);
    return res.status(500).json({
      message: "Failed to fetch issue",
    });
  }
};

export const convertIssueToTask = async (req: any, res: Response) => {
  try {
    const { issueId } = req.params;
    const { priority, deadline, assigneeIds } = req.body;
    const { role, id } = req.user;

    if (role !== "ADMIN") {
      return res.sendStatus(403);
    }

    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
      include: { project: true },
    });

    if (!issue) {
      return res.status(404).json({
        message: "Issue not found",
      });
    }

    if (issue.status === "CONVERTED_TO_TASK") {
      return res.status(400).json({
        message: "Issue already converted",
      });
    }

    const task = await prisma.task.create({
      data: {
        title: issue.title,
        description: issue.description,
        priority,
        deadline,
        projectId: issue.projectId,
        createdById: id,
        assignments: {
          create: assigneeIds.map((uid: string) => ({
            userId: uid,
          })),
        },
      },
    });

    await prisma.issue.update({
      where: { id: issueId },
      data: {
        status: "CONVERTED_TO_TASK",
        convertedTaskId: task.id,
      },
    });

    //Cache Invalidation
    await deleteCache([
      `issues:${issue.projectId}:*`,
      `issue:${issueId}:*`,

      `tasks:*`,
      `task:${task.id}:*`,

      `project:${issue.projectId}:*`,
      `projects:*`,
    ]);

    await createNotification({
      userId: issue.project.clientId,
      title: "Issue Converted to Task",
      message: `Issue "${issue.title}" has been converted to a task`,
      entityType: "ISSUE",
      entityId: issue.id,
    });

    await createBulkNotification({
      userIds: assigneeIds,
      title: "New Task from Issue",
      message: `Task created from issue "${issue.title}"`,
      entityType: "TASK",
      entityId: task.id,
    });

    return res.json({
      success: true,
      message: "Issue converted to task",
      task,
    });
  } catch (error) {
    console.error("Convert Issue Error:", error);
    return res.status(500).json({
      message: "Conversion failed",
    });
  }
};