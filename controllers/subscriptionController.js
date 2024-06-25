const Subscription = require('../models/Subscription');
const parseVErr = require("../util/parseValidationErr");
const csrf = require("host-csrf");
const moment = require('moment');
const fetchCompanyData = require('../services/fetchCompanyData');
const { notifyUser } = require('../Notification/notificationService');

// Fetch subscriptions for the logged-in user
const getSubscriptions = async (req, res) => {
  try {
    const searchQuery = req.query.search || '';
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = 10;

    const sortField = req.query.sort || 'dueDate';
    const sortOrder = req.query.order || 'asc';
    let paymentRange = req.query.paymentRange || '';
    const status = req.query.status ? (Array.isArray(req.query.status) ? req.query.status : [req.query.status]) : [];
    const category = req.query.category ? (Array.isArray(req.query.category) ? req.query.category : [req.query.category]) : [];
    const paymentType = req.query.paymentType ? (Array.isArray(req.query.paymentType) ? req.query.paymentType : [req.query.paymentType]) : [];
    const paymentCycle = req.query.paymentCycle ? (Array.isArray(req.query.paymentCycle) ? req.query.paymentCycle : [req.query.paymentCycle]) : [];

    // Ensure paymentRange is a string
    if (Array.isArray(paymentRange)) {
      paymentRange = paymentRange[0];
    }

    // Parse the payment range
    let minPayment = 0;
    let maxPayment = 100;

    const rangeParts = paymentRange.split('-').map(Number);
    if (rangeParts.length === 2 && !isNaN(rangeParts[0]) && !isNaN(rangeParts[1])) {
      minPayment = rangeParts[0];
      maxPayment = rangeParts[1];
    }

    // Define the search criteria
    const searchCriteria = {
      createdBy: userId,
      $or: [
        { company: { $regex: new RegExp(searchQuery, 'i') } },
        { category: { $regex: new RegExp(searchQuery, 'i') } },
        { status: { $regex: new RegExp(searchQuery, 'i') } },
        { email: { $regex: new RegExp(searchQuery, 'i') } }
      ],
      monthlyPayment: { $gte: minPayment, $lte: maxPayment }
    };

    if (status.length) {
      searchCriteria.status = { $in: status };
    }

    if (category.length) {
      searchCriteria.category = { $in: category };
    }

    if (paymentType.length) {
      searchCriteria.paymentType = { $in: paymentType };
    }

    if (paymentCycle.length) {
      searchCriteria.paymentCycle = { $in: paymentCycle };
    }

    const options = {
      page: page,
      limit: limit,
      sort: { [sortField]: sortOrder }
    };

    const result = await Subscription.paginate(searchCriteria, options);
    const token = csrf.token(req, res);

    // Generate query params for pagination and sorting
    const queryParams = Object.keys(req.query).map(key => {
      if (key !== 'page') {
        return `${key}=${encodeURIComponent(req.query[key])}`;
      }
      return null;
    }).filter(Boolean).join('&');

    res.render("subscriptions", {
      subscriptions: result.docs,
      totalPages: result.totalPages,
      currentPage: result.page,
      searchQuery,
      _csrf: token,
      moment,
      sort: req.query.sort || '',
      order: req.query.order || '',
      queryParams,
      paymentRange,
      status: req.query.status || '',
      category: req.query.category || '',
      paymentType: req.query.paymentType || '',
      paymentCycle: req.query.paymentCycle || ''
    });
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    req.flash("error", "Unable to fetch subscriptions");
    res.redirect("/");
  }
};

const createSubscription = async (req, res) => {
  try {
    req.body.createdBy = req.user._id;
    req.body.email = req.user.email; // Ensure email is added to the subscription
    req.body.dueDate = moment(req.body.dueDate).toDate();

    // Fetch company information from the JSON file on Google Drive
    const companyData = await fetchCompanyData(req.body.email);

    if (companyData.length > 0) {
      req.body.company = companyData[0].name || req.body.company;
      req.body.companyLogo = companyData[0].logo || req.body.companyLogo;
      req.body.companyUrl = companyData[0].website || req.body.companyUrl;
    }

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
      res.render("subscription", { subscription: null, errors: req.flash("error"), _csrf: token, moment, companyData: [], req });
    } else {
      console.error("Error creating subscription:", error);
      req.flash("error", "Error creating subscription");
      res.redirect("/subscriptions");
    }
  }
};


// Render the form to create a new subscription
const getSubscriptionForm = async (req, res) => {
  try {
    const token = csrf.token(req, res);

    // Fetch company data for autocomplete suggestions
    const companyData = await fetchCompanyData('');

    res.render("subscription", { subscription: null, _csrf: token, moment, companyData, req });
  } catch (error) {
    console.error("Error fetching company data:", error);
    req.flash("error", "Unable to fetch company data");
    res.redirect("/subscriptions");
  }
};

// Render the form to edit an existing subscription
const editSubscriptionForm = async (req, res) => {
  try {
    const subscriptionId = req.params.id;  // Ensure the _id is correctly extracted
    if (!subscriptionId) {
      req.flash("error", "Subscription ID is missing");
      return res.redirect("/subscriptions");
    }
    
    const subscription = await Subscription.findOne({ _id: subscriptionId, createdBy: req.user._id });
    if (!subscription) {
      req.flash("error", "Subscription not found");
      return res.redirect("/subscriptions");
    }

    const token = csrf.token(req, res);

    // Fetch company data for autocomplete suggestions
    const companyData = await fetchCompanyData('');

    res.render("subscription", { subscription, _csrf: token, moment, companyData, req });
  } catch (error) {
    console.error("Error fetching subscription:", error);
    req.flash("error", "Error fetching subscription");
    res.redirect("/subscriptions");
  }
};

const updateSubscription = async (req, res) => {
  try {
    req.body.dueDate = moment(req.body.dueDate).toDate();

    // Fetch company information from the JSON file on Google Drive
    const companyData = await fetchCompanyData(req.body.email);

    if (companyData.length > 0) {
      req.body.company = companyData[0].name || req.body.company;
      req.body.companyLogo = companyData[0].logo || req.body.companyLogo;
      req.body.companyUrl = companyData[0].website || req.body.companyUrl;
    }

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
      res.render("subscription", { subscription: req.body, errors: req.flash("error"), _csrf: token, moment, companyData: [], req });
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
