require("dotenv").config();
const nodemailer = require('nodemailer');
const moment = require('moment');

// Configure the email transport using the default SMTP transport and a GMail account.
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Function to send email notifications
const sendNotification = (to, subject, text) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        text
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error(`Error sending email to ${to}: ${error}`);
        } else {
            console.log(`Email sent to ${to}: ${info.response}`);
        }
    });
};

// Function to format and send email notifications
const notifyUser = (userEmail, userName, subscriptionService, dueDate, notificationPreference) => {
    const subject = "🚨 Your Subscription Reminder 🚨";

    const notificationText = getNotificationText(notificationPreference, dueDate);

    const text = `
Hi ${userName},

It's me Sub, your subscription saver. Just a friendly reminder that your subscription for ${subscriptionService} is due ${notificationText}.

To avoid any interruptions or charges, please head over to your ${subscriptionService} account to renew, pay, or cancel your free trial subscription.

Thank you for using Saver Sub to keep track of all your subscriptions. If you have any questions or need assistance, feel free to reach out to our support team.

Best regards,
Sub
Saver Sub Team
`;

    sendNotification(userEmail, subject, text);
};

// Function to generate the appropriate notification text
const getNotificationText = (notificationPreference, dueDate) => {
    switch (notificationPreference) {
        case 'same day':
            return "today";
        case '2 days before':
            return `in 2 days on ${moment(dueDate).format('MMMM Do, YYYY')}`;
        case '3 days before':
            return `in 3 days on ${moment(dueDate).format('MMMM Do, YYYY')}`;
        case '4 days before':
            return `in 4 days on ${moment(dueDate).format('MMMM Do, YYYY')}`;
        case '5 days before':
            return `in 5 days on ${moment(dueDate).format('MMMM Do, YYYY')}`;
        case '1 week before':
            return `in 1 week on ${moment(dueDate).format('MMMM Do, YYYY')}`;
        default:
            return "soon";
    }
};

module.exports = {
    notifyUser
};
