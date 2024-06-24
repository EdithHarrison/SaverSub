const User = require("../models/User");
const parseVErr = require("../util/parseValidationErr");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const { promisify } = require("util");

const registerShow = (req, res) => {
  res.render("register", { _csrf: res.locals._csrf });
};

const registerDo = async (req, res, next) => {
  if (req.body.password !== req.body.password1) {
    req.flash("error", "The passwords entered do not match.");
    return res.render("register", { errors: req.flash("error"), _csrf: res.locals._csrf });
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
    return res.render("register", { errors: req.flash("error"), _csrf: res.locals._csrf });
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
  res.render("logon", { _csrf: res.locals._csrf });
};

// Show forget password form
const forgetPasswordShow = (req, res) => {
  res.render("forgetPassword", { _csrf: res.locals._csrf });
};

// Handle forget password form submission
const forgetPasswordDo = async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    req.flash("error", "No account with that email address exists.");
    return res.redirect("/sessions/forgetPassword");
  }

  const token = (await promisify(crypto.randomBytes)(20)).toString('hex');
  user.resetPasswordToken = token;
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  await user.save();

  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    to: user.email,
    from: 'passwordreset@example.com',
    subject: 'Password Reset',
    text: `Hi ${user.name},\n\n
            This is Sub, your subscription saver. You are receiving this email because you (or someone else) have requested to reset your Saver Sub password.\n\n
            Please click on the following link, or paste this into your browser to complete the process:\n\n
            http://${req.headers.host}/sessions/resetPassword/${token}\n\n
            If you did not request this, please ignore this email and your password will remain unchanged.\n\n
            Thank you for using Saver Sub to keep track of all your subscriptions. If you have any questions or need assistance, feel free to reach out to our support team.\n\n
            Best regards,\n
            Sub\n
            Saver Sub Team`
  };

  transporter.sendMail(mailOptions, (err) => {
    if (err) {
      console.error('There was an error: ', err);
      return next(err);
    }
    req.flash("info", `An e-mail has been sent to ${user.email} with further instructions.`);
    res.redirect("/sessions/forgetPassword");
  });
};

// Show reset password form
const resetPasswordShow = async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) {
    req.flash("error", "Password reset token is invalid or has expired.");
    return res.redirect("/sessions/forgetPassword");
  }
  res.render("resetPassword", { token: req.params.token, _csrf: res.locals._csrf });
};

// Handle reset password form submission
const resetPasswordDo = async (req, res, next) => {
  const user = await User.findOne({
    resetPasswordToken: req.params.token,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) {
    req.flash("error", "Password reset token is invalid or has expired.");
    return res.redirect("back");
  }

  if (req.body.password !== req.body.password1) {
    req.flash("error", "Passwords do not match.");
    return res.redirect("back");
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  req.flash("success", "Success! Your password has been changed.");
  res.redirect("/sessions/logon");
};

module.exports = {
  registerShow,
  registerDo,
  logoff,
  logonShow,
  forgetPasswordShow,
  forgetPasswordDo,
  resetPasswordShow,
  resetPasswordDo,
};
