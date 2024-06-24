const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const SubscriptionSchema = new mongoose.Schema({
    company: {
        type: String,
        required: [true, 'Please provide company name'],
        maxlength: 50
    },
    dueDate: {
        type: Date,
        required: [true, 'Please provide due date']
    },
    monthlyPayment: {
        type: Number,
        required: [true, 'Please provide monthly payment']
    },
    status: {
        type: String,
        enum: ['free trial', 'active', 'canceled'],
        default: 'free trial'
    },
    category: {
        type: String,
        enum: [
            'Entertainment & Leisure',
            'Health & Fitness',
            'Finance',
            'Food',
            'Clothing',
            'Utilities',
            'Housing',
            'Software & Tools',
            'Streaming Services',
            'Education & Learning',
            'Transportation',
            'Telecommunications',
            'Insurance',
            'Retail & Shopping',
            'Travel & Leisure',
            'Gaming',
            'Health & Wellness',
            'Home Services',
            'Financial Services'
        ]
    },
    email: {
        type: String,
        required: [true, 'Please provide email']
    },
    createdBy: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: [true, 'Please provide user']
    },
    paymentType: {
        type: String,
        enum: ['one-time', 'recurring'],
        default: 'recurring'
    },
    paymentCycle: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'quarterly', 'biyearly', 'yearly', 'manually'],
        default: 'monthly'
    },
    lastNotified: {
        type: Date
    }
}, { timestamps: true });

SubscriptionSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Subscription', SubscriptionSchema);
