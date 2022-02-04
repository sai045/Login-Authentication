const express = require("express");
const { check } = require("express-validator");

const router = express.Router();

const userCollecter = require("../Collectors/UserCollecters");

router.post(
  "/signin",
  [
    check("name").not().isEmpty(),
    check("email").isEmail(),
    check("password").isLength({ min: 6 }),
    check("confirm-password").matches("password"),
  ],
  userCollecter.signin
);

router.post("/login", userCollecter.login);

router.post("/forgotPassword", userCollecter.forgotpassword);

router.patch(
  "/resetPassword/:id/:token",
  [
    check("password").isLength({ min: 6 }),
    check("confirmpassword").matches("password"),
  ],
  userCollecter.resetpassword
);

module.exports = router;
