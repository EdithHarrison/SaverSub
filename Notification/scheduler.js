const cron = require('node-cron');
const moment = require('moment');
const Subscription = require('../models/Subscription');
const { notifyUser } = require('../Notification/notificationService');

const checkSubscriptions = async () => {
  try {
    console.log('Scheduler running...');
    const subscriptions = await Subscription.find({}).populate('createdBy');
    const today = moment().startOf('day');

    subscriptions.forEach(subscription => {
      const dueDate = moment(subscription.dueDate).startOf('day');
      const notificationPreference = subscription.notificationPreference || 'same day';

      let notify = false;
      switch (notificationPreference) {
        case 'same day':
          notify = dueDate.isSame(today);
          break;
        case '2 days before':
          notify = dueDate.isSame(today.clone().add(2, 'days'));
          break;
        case '3 days before':
          notify = dueDate.isSame(today.clone().add(3, 'days'));
          break;
        case '4 days before':
          notify = dueDate.isSame(today.clone().add(4, 'days'));
          break;
        case '5 days before':
          notify = dueDate.isSame(today.clone().add(5, 'days'));
          break;
        case '1 week before':
          notify = dueDate.isSame(today.clone().add(1, 'week'));
          break;
        default:
          notify = dueDate.isSame(today);
      }

      if (notify) {
        console.log(`Sending notification for subscription: ${subscription.company}`); // Log notification send
        notifyUser(subscription.email, subscription.createdBy.name, subscription.company, subscription.dueDate, notificationPreference); // Pass dueDate and notificationPreference

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
            case 'biannually':
              subscription.dueDate = moment(subscription.dueDate).add(6, 'months').toDate();
              break;
            case 'annually':
              subscription.dueDate = moment(subscription.dueDate).add(1, 'year').toDate();
              break;
            // For 'manually', do nothing
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
