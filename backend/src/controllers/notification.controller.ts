import { Request, Response } from "express";
import {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../services/notification.service";

export const getNotifications = async (req: any, res: Response) => {
  try {
    const { id } = req.user;

    const notifications = await getUserNotifications(id);

    return res.json({
      success: true,
      notifications,
    });
  } catch (error) {
    console.error("Get Notifications Error:", error);
    return res.status(500).json({
      message: "Failed to fetch notifications",
    });
  }
};

export const markNotificationAsRead = async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { id: userId } = req.user;

    const notification = await markNotificationRead(id, userId);

    return res.json({
      success: true,
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    console.error("Mark Notification Read Error:", error);
    return res.status(500).json({
      message: "Failed to update notification",
    });
  }
};

export const markAllAsRead = async (req: any, res: Response) => {
  try {
    const { id } = req.user;

    await markAllNotificationsRead(id);

    return res.json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Mark All Notifications Error:", error);
    return res.status(500).json({
      message: "Failed to update notifications",
    });
  }
};