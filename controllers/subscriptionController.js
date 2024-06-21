const Subscription = require('../models/Subscription');
const parseVErr = require("../util/parseValidationErr");
const csrf = require("host-csrf");

const getSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ createdBy: req.user._id });
    const token = csrf.token(req, res);
    res.render("subscriptions", { subscriptions, _csrf: token });
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    req.flash("error", "Unable to fetch subscriptions");
    res.redirect("/");
  }
};

const createSubscription = async (req, res) => {
  try {
    req.body.createdBy = req.user._id;
    await Subscription.create(req.body);
    req.flash("info", "Subscription created successfully");
    res.redirect("/subscriptions");
  } catch (error) {
    if (error.constructor.name === "ValidationError") {
      parseVErr(error, req);
      const token = csrf.token(req, res);
      res.render("subscription", { subscription: null, errors: req.flash("error"), _csrf: token });
    } else {
      console.error("Error creating subscription:", error);
      req.flash("error", "Error creating subscription");
      res.redirect("/subscriptions");
    }
  }
};

const getSubscriptionForm = (req, res) => {
  const token = csrf.token(req, res);
  res.render("subscription", { subscription: null, _csrf: token });
};

const editSubscriptionForm = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!subscription) {
      req.flash("error", "Subscription not found");
      return res.redirect("/subscriptions");
    }
    const token = csrf.token(req, res);
    res.render("subscription", { subscription, _csrf: token });
  } catch (error) {
    console.error("Error fetching subscription:", error);
    req.flash("error", "Error fetching subscription");
    res.redirect("/subscriptions");
  }
};

const updateSubscription = async (req, res) => {
  try {
    await Subscription.updateOne({ _id: req.params.id, createdBy: req.user._id }, req.body);
    req.flash("info", "Subscription updated successfully");
    res.redirect("/subscriptions");
  } catch (error) {
    if (error.constructor.name === "ValidationError") {
      parseVErr(error, req);
      const token = csrf.token(req, res);
      res.render("subscription", { subscription: req.body, errors: req.flash("error"), _csrf: token });
    } else {
      console.error("Error updating subscription:", error);
      req.flash("error", "Error updating subscription");
      res.redirect("/subscriptions");
    }
  }
};

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
