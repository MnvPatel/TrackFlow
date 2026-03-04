import prisma from "../prisma";
import { getCache, setCache, deleteCache } from "../utils/cache";

type EntityType = "PROJECT" | "TASK" | "ISSUE" | "COMMENT" | "SUBMISSION";

interface NotificationPayload {
  userId: string;
  title: string;
  message: string;
  entityType: EntityType;
  entityId: string;
}

interface BulkNotificationPayload {
  userIds: string[];
  title: string;
  message: string;
  entityType: EntityType;
  entityId: string;
}

const CACHE_TTL = 300;

//CREATE SINGLE NOTIFICATION
export const createNotification = async ({
  userId,
  title,
  message,
  entityType,
  entityId,
}: NotificationPayload) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        entityType,
        entityId,
      },
    });

    //Cache Invalidation
    await deleteCache([`notifications:${userId}`]);

    return notification;
  } catch (error) {
    console.error("Create Notification Error:", error);
  }
};

//CREATE BULK NOTIFICATIONS
export const createBulkNotification = async ({
  userIds,
  title,
  message,
  entityType,
  entityId,
}: BulkNotificationPayload) => {
  try {
    if (!userIds.length) return;

    await prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        title,
        message,
        entityType,
        entityId,
      })),
    });

    //Cache Invalidation
    await deleteCache(userIds.map((id) => `notifications:${id}`));
  } catch (error) {
    console.error("Bulk Notification Error:", error);
  }
};

//GET USER NOTIFICATIONS
export const getUserNotifications = async (userId: string) => {
  try {
    const cacheKey = `notifications:${userId}`;

    const cached = await getCache(cacheKey);
    if (cached) {
      return cached;
    }

    const notifications = await prisma.notification.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });

    await setCache(cacheKey, notifications, CACHE_TTL);

    return notifications;
  } catch (error) {
    console.error("Get Notifications Error:", error);
  }
};

//MARK SINGLE NOTIFICATION READ
export const markNotificationRead = async (
  notificationId: string,
  userId: string
) => {
  try {
    const notification = await prisma.notification.update({
      where: {
        id: notificationId,
      },
      data: {
        isRead: true,
      },
    });

    await deleteCache([`notifications:${userId}`]);

    return notification;
  } catch (error) {
    console.error("Mark Notification Read Error:", error);
  }
};

//MARK ALL NOTIFICATIONS READ
export const markAllNotificationsRead = async (userId: string) => {
  try {
    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    await deleteCache([`notifications:${userId}`]);
  } catch (error) {
    console.error("Mark All Notifications Read Error:", error);
  }
};