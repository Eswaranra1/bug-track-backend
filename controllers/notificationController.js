const Notification = require("../models/Notification");

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("bugId", "title status")
      .lean();
    const unreadCount = await Notification.countDocuments({
      userId: req.user.id,
      read: false,
    });
    res.json({ notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ message: error.message || "Server error" });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!notification) return res.status(404).json({ message: "Notification not found" });
    notification.read = true;
    await notification.save();
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message || "Server error" });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, read: false },
      { read: true }
    );
    res.json({ message: "All marked as read" });
  } catch (error) {
    res.status(500).json({ message: error.message || "Server error" });
  }
};
