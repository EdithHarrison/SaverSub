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
  res.redirect("/");
};

const logoff = (req, res) => {
  req.session.destroy(function (err) {
    if (err) {
      console.log(err);
      return res.redirect("/"); // Redirect to home even if there's an error
    }
    res.redirect("/sessions/logon"); // Redirect to login page after logging out
  });
};

const logonShow = (req, res) => {
  if (req.user) {
    return res.redirect("/");
  }
  res.render("logon");
};

module.exports = {
  registerShow,
  registerDo,
  logoff,
  logonShow,
};
