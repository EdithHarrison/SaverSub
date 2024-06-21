const User = require("../models/User");
const parseVErr = require("../util/parseValidationErr");

const registerShow = (req, res) => {
  res.render("register");
};

const registerDo = async (req, res, next) => {
  if (req.body.password !== req.body.password1) {
    req.flash("error", "The passwords entered do not match.");
    return res.render("register", { errors: req.flash("error") });
  }
  try {
    await User.create(req.body);
    res.redirect("/sessions/logon");
  } catch (e) {
    if (e.constructor.name === "ValidationError") {
      parseVErr(e, req);
    } else if (e.name === "MongoServerError" && e.code === 11000) {
      req.flash("error", "That email address is already registered.");
    } else {
      return next(e);
    }
    return res.render("register", { errors: req.flash("error") });
  }
};

const logoff = (req, res) => {
  req.session.destroy(function (err) {
    if (err) {
      console.log('Error during logoff:', err);
      return res.redirect("/"); // Redirect to home even if there's an error
    }
    res.redirect("/"); // Redirect to home page after logging out
  });
};

const logonShow = (req, res) => {
  if (req.user) {
    console.log("User already logged in, redirecting to /subscriptions");
    return res.redirect("/subscriptions"); // Redirect to subscriptions if already logged in
  }
  res.render("logon");
};

module.exports = {
  registerShow,
  registerDo,
  logoff,
  logonShow,
};
