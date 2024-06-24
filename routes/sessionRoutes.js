const express = require("express");
const passport = require("passport");
const router = express.Router();

const {
  logonShow,
  registerShow,
  registerDo,
  logoff,
  forgetPasswordShow,
  forgetPasswordDo,
  resetPasswordShow,
  resetPasswordDo,
} = require("../controllers/sessionController");

router.route("/register").get(registerShow).post(registerDo);

router
  .route("/logon")
  .get(logonShow)
  .post(
    passport.authenticate("local", {
      successRedirect: "/subscriptions",
      failureRedirect: "/sessions/logon",
      failureFlash: true,
    })
  );

router.route("/logoff").post(logoff);

// Forget Password Routes
router.route("/forgetPassword").get(forgetPasswordShow).post(forgetPasswordDo);
router.route("/resetPassword/:token").get(resetPasswordShow).post(resetPasswordDo);

module.exports = router;
