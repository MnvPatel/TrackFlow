import { Request, Response } from "express";
import prisma from "../prisma";
import { getCache, setCache } from "../utils/cache";

export const getAdminAnalytics = async (req: any, res: Response) => {
  try {
    const cacheKey = "analytics:admin";

    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        analytics: cached
      });
    }

    const [
      totalProjects,
      activeProjects,
      completedProjects,
      totalTasks,
      pendingTasks,
      inProgressTasks,
      submittedTasks,
      approvedTasks,
      totalEmployees,
      totalClients,
      openIssues
    ] = await Promise.all([

      prisma.project.count(),

      prisma.project.count({
        where: { status: "ACTIVE" }
      }),

      prisma.project.count({
        where: { status: "COMPLETED" }
      }),

      prisma.task.count(),

      prisma.task.count({
        where: { status: "PENDING" }
      }),

      prisma.task.count({
        where: { status: "IN_PROGRESS" }
      }),

      prisma.task.count({
        where: { status: "SUBMITTED" }
      }),

      prisma.task.count({
        where: { status: "APPROVED" }
      }),

      prisma.user.count({
        where: { role: "EMPLOYEE" }
      }),

      prisma.user.count({
        where: { role: "CLIENT" }
      }),

      prisma.issue.count({
        where: { status: "OPEN" }
      })

    ]);

    const analytics = {
      projects: {
        total: totalProjects,
        active: activeProjects,
        completed: completedProjects
      },

      tasks: {
        total: totalTasks,
        pending: pendingTasks,
        inProgress: inProgressTasks,
        submitted: submittedTasks,
        approved: approvedTasks
      },

      users: {
        employees: totalEmployees,
        clients: totalClients
      },

      issues: {
        open: openIssues
      }
    };

    await setCache(cacheKey, analytics, 60);

    return res.json({
      success: true,
      analytics
    });

  } catch (error) {
    console.error("Admin Analytics Error:", error);

    return res.status(500).json({
      message: "Failed to fetch analytics"
    });
  }
};

export const getEmployeeAnalytics = async (req: any, res: Response) => {
  try {
    const employeeId = req.user.id;
    const cacheKey = `analytics:employee:${employeeId}`;

    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        analytics: cached
      });
    }

    const [
      assignedTasks,
      pendingTasks,
      inProgressTasks,
      submittedTasks,
      approvedTasks,
      workingProjects,
      totalSubmissions
    ] = await Promise.all([

      prisma.task.count({
        where: {
          assignments: {
            some: { userId: employeeId }
          }
        }
      }),

      prisma.task.count({
        where: {
          status: "PENDING",
          assignments: {
            some: { userId: employeeId }
          }
        }
      }),

      prisma.task.count({
        where: {
          status: "IN_PROGRESS",
          assignments: {
            some: { userId: employeeId }
          }
        }
      }),

      prisma.task.count({
        where: {
          status: "SUBMITTED",
          assignments: {
            some: { userId: employeeId }
          }
        }
      }),

      prisma.task.count({
        where: {
          status: "APPROVED",
          assignments: {
            some: { userId: employeeId }
          }
        }
      }),

      prisma.projectMember.count({
        where: {
          userId: employeeId
        }
      }),

      prisma.workSubmission.count({
        where: {
          submittedById: employeeId
        }
      })

    ]);

    const analytics = {
      tasks: {
        assigned: assignedTasks,
        pending: pendingTasks,
        inProgress: inProgressTasks,
        submitted: submittedTasks,
        approved: approvedTasks
      },
      projects: {
        workingOn: workingProjects
      },
      submissions: {
        total: totalSubmissions
      }
    };

    await setCache(cacheKey, analytics, 30);

    return res.json({
      success: true,
      analytics
    });

  } catch (error) {
    console.error("Employee Analytics Error:", error);

    return res.status(500).json({
      message: "Failed to fetch employee analytics"
    });
  }
};

export const getClientAnalytics = async (req: any, res: Response) => {
  try {
    const clientId = req.user.id;
    const cacheKey = `analytics:client:${clientId}`;

    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        analytics: cached
      });
    }

    const [
      totalProjects,
      activeProjects,
      completedProjects,
      totalTasks,
      approvedTasks,
      openIssues,
      recentSubmissions
    ] = await Promise.all([

      prisma.project.count({
        where: { clientId }
      }),

      prisma.project.count({
        where: {
          clientId,
          status: "ACTIVE"
        }
      }),

      prisma.project.count({
        where: {
          clientId,
          status: "COMPLETED"
        }
      }),

      prisma.task.count({
        where: {
          project: {
            clientId
          }
        }
      }),

      prisma.task.count({
        where: {
          status: "APPROVED",
          project: {
            clientId
          }
        }
      }),

      prisma.issue.count({
        where: {
          status: "OPEN",
          project: {
            clientId
          }
        }
      }),

      prisma.workSubmission.findMany({
        where: {
          task: {
            project: {
              clientId
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        },
        take: 5,
        select: {
          id: true,
          createdAt: true,
          task: {
            select: {
              title: true
            }
          },
          submittedBy: {
            select: {
              name: true
            }
          }
        }
      })

    ]);

    const analytics = {
      projects: {
        total: totalProjects,
        active: activeProjects,
        completed: completedProjects
      },
      tasks: {
        total: totalTasks,
        approved: approvedTasks,
        pending: totalTasks - approvedTasks
      },
      issues: {
        open: openIssues
      },
      submissions: {
        recent: recentSubmissions
      }
    };

    await setCache(cacheKey, analytics, 60);

    return res.json({
      success: true,
      analytics
    });

  } catch (error) {
    console.error("Client Analytics Error:", error);

    return res.status(500).json({
      message: "Failed to fetch client analytics"
    });
  }
};