const cron = require('node-cron');
const Subscription = require('../models/Subscription');
const { notifyUser } = require('../Notification/notificationService'); // Import notifyUser

const checkSubscriptions = async () => {
  try {
    console.log('Scheduler running...'); // Log scheduler run
    const subscriptions = await Subscription.find({});
    const today = new Date().toISOString().split('T')[0];
    
    subscriptions.forEach(subscription => {
      const dueDate = subscription.dueDate.toISOString().split('T')[0];
      if (dueDate === today) {
        console.log(`Sending notification for subscription: ${subscription.company}`); // Log notification send
        notifyUser(subscription.email, subscription.createdBy.name, subscription.company); // Use notifyUser instead of sendNotification
      }
    });
  } catch (error) {
    console.error(`Error checking subscriptions: ${error}`);
  }
};

// Schedule daily check at midnight
cron.schedule('0 0 * * *', checkSubscriptions);

module.exports = checkSubscriptions;
