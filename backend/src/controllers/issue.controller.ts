import { Request, Response } from "express";
import prisma from "../prisma";
import { deleteCache, getCache, setCache } from "../utils/cache";

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
