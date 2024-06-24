const cron = require('node-cron');
const moment = require('moment');
const Subscription = require('../models/Subscription');
const { notifyUser } = require('../Notification/notificationService'); // Import notifyUser

const checkSubscriptions = async () => {
  try {
    console.log('Scheduler running...'); // Log scheduler run
    const subscriptions = await Subscription.find({});
    const today = moment().startOf('day');

    subscriptions.forEach(subscription => {
      const dueDate = moment(subscription.dueDate).startOf('day');
      
      // Send notification if due date is today
      if (dueDate.isSame(today)) {
        console.log(`Sending notification for subscription: ${subscription.company}`); // Log notification send
        notifyUser(subscription.email, subscription.createdBy.name, subscription.company); // Use notifyUser instead of sendNotification

        // If the subscription is recurring, update the due date based on the payment cycle
        if (subscription.paymentType === 'recurring') {
          switch (subscription.paymentCycle) {
            case 'daily':
              subscription.dueDate = moment(subscription.dueDate).add(1, 'day').toDate();
              break;
            case 'weekly':
              subscription.dueDate = moment(subscription.dueDate).add(1, 'week').toDate();
              break;
            case 'monthly':
              subscription.dueDate = moment(subscription.dueDate).add(1, 'month').toDate();
              break;
            case 'quarterly':
              subscription.dueDate = moment(subscription.dueDate).add(3, 'months').toDate();
              break;
            case 'biyearly':
              subscription.dueDate = moment(subscription.dueDate).add(6, 'months').toDate();
              break;
            case 'yearly':
              subscription.dueDate = moment(subscription.dueDate).add(1, 'year').toDate();
              break;
            // For 'manually', we do nothing
          }
          subscription.save();
        }
      }
    });
  } catch (error) {
    console.error(`Error checking subscriptions: ${error}`);
  }
};

// Schedule daily check at midnight
cron.schedule('0 0 * * *', checkSubscriptions);

module.exports = checkSubscriptions;
