const notificationService = require('../services/notificationService');

const createNotification = async (req, res, next) => {
  try {
    const notification = await notificationService.createNotification(req.body);
    res.status(201).json(notification);
  } catch (error) {
    next(error);
  }
};

const getNotifications = async (req, res, next) => {
  try {
    const notifications = await notificationService.getNotifications();
    res.json(notifications);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createNotification,
  getNotifications,
};
