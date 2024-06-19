const express = require("express");
const router = express.Router();
const { getSubscriptions, createSubscription, getSubscriptionForm, editSubscriptionForm, updateSubscription, deleteSubscription } = require("../controllers/subscriptionController");

router.route("/").get(getSubscriptions).post(createSubscription);
router.route("/new").get(getSubscriptionForm);
router.route("/edit/:id").get(editSubscriptionForm);
router.route("/update/:id").post(updateSubscription);
router.route("/delete/:id").post(deleteSubscription);

module.exports = router;
