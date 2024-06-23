const Subscription = require('../models/Subscription');
const parseVErr = require("../util/parseValidationErr");
const csrf = require("host-csrf");
const moment = require('moment');
const { notifyUser } = require('../Notification/notificationService');

/// Fetch subscriptions for the logged-in user
const getSubscriptions = async (req, res) => {
  try {
    const searchQuery = req.query.search || '';
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = 10;

    // Define the search criteria
    const searchCriteria = {
      createdBy: userId,
      $or: [
        { company: { $regex: new RegExp(searchQuery, 'i') } },
        { category: { $regex: new RegExp(searchQuery, 'i') } },
        { status: { $regex: new RegExp(searchQuery, 'i') } },
        { email: { $regex: new RegExp(searchQuery, 'i') } }
      ]
    };

    // If searchQuery can be parsed as a number, add monthlyPayment to the criteria
    const searchNumber = parseFloat(searchQuery);
    if (!isNaN(searchNumber)) {
      searchCriteria.$or.push({ monthlyPayment: searchNumber });
    }

    const options = {
      page: page,
      limit: limit,
      sort: { dueDate: 1 }
    };

    const result = await Subscription.paginate(searchCriteria, options);
    const token = csrf.token(req, res);

    res.render("subscriptions", {
      subscriptions: result.docs,
      totalPages: result.totalPages,
      currentPage: result.page,
      searchQuery,
      _csrf: token,
      moment
    });
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    req.flash("error", "Unable to fetch subscriptions");
    res.redirect("/");
  }
};

// Create a new subscription
const createSubscription = async (req, res) => {
  try {
    req.body.createdBy = req.user._id;
    req.body.email = req.user.email; // Ensure email is added to the subscription
    req.body.dueDate = moment(req.body.dueDate).toDate(); 

    const subscription = await Subscription.create(req.body);

    // Check if due date is today
    if (moment(subscription.dueDate).isSame(moment(), 'day')) {
      notifyUser(subscription.email, req.user.name, subscription.company);
    }

    req.flash("info", "Subscription created successfully");
    res.redirect("/subscriptions");
  } catch (error) {
    if (error.constructor.name === "ValidationError") {
      parseVErr(error, req);
      const token = csrf.token(req, res);
      res.render("subscription", { subscription: null, errors: req.flash("error"), _csrf: token, moment, req });
    } else {
      console.error("Error creating subscription:", error);
      req.flash("error", "Error creating subscription");
      res.redirect("/subscriptions");
    }
  }
};

// Render the form to create a new subscription
const getSubscriptionForm = (req, res) => {
  const token = csrf.token(req, res);
  res.render("subscription", { subscription: null, _csrf: token, moment, req });
};

// Render the form to edit an existing subscription
const editSubscriptionForm = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!subscription) {
      req.flash("error", "Subscription not found");
      return res.redirect("/subscriptions");
    }
    const token = csrf.token(req, res);
    res.render("subscription", { subscription, _csrf: token, moment, req });
  } catch (error) {
    console.error("Error fetching subscription:", error);
    req.flash("error", "Error fetching subscription");
    res.redirect("/subscriptions");
  }
};

// Update an existing subscription
const updateSubscription = async (req, res) => {
  try {
    req.body.dueDate = moment(req.body.dueDate).toDate();
    const subscription = await Subscription.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      { ...req.body, email: req.user.email }, // Ensure email is updated if necessary
      { new: true }
    );

    // Check if due date is today
    if (moment(subscription.dueDate).isSame(moment(), 'day')) {
      notifyUser(subscription.email, req.user.name, subscription.company);
    }

    req.flash("info", "Subscription updated successfully");
    res.redirect("/subscriptions");
  } catch (error) {
    if (error.constructor.name === "ValidationError") {
      parseVErr(error, req);
      const token = csrf.token(req, res);
      res.render("subscription", { subscription: req.body, errors: req.flash("error"), _csrf: token, moment, req });
    } else {
      console.error("Error updating subscription:", error);
      req.flash("error", "Error updating subscription");
      res.redirect("/subscriptions");
    }
  }
};

// Delete a subscription
const deleteSubscription = async (req, res) => {
  try {
    await Subscription.deleteOne({ _id: req.params.id, createdBy: req.user._id });
    req.flash("info", "Subscription deleted successfully");
    res.redirect("/subscriptions");
  } catch (error) {
    console.error("Error deleting subscription:", error);
    req.flash("error", "Error deleting subscription");
    res.redirect("/subscriptions");
  }
};

module.exports = {
  getSubscriptions,
  createSubscription,
  getSubscriptionForm,
  editSubscriptionForm,
  updateSubscription,
  deleteSubscription,
};
