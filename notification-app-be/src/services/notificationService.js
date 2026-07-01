let notifications = [];

const createNotification = async (notification) => {
  notifications.push(notification);
  return notification;
};

const getNotifications = async () => {
  return notifications;
};

module.exports = {
  createNotification,
  getNotifications,
};
