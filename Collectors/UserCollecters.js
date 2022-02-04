const error = require("../Models/error");
const { validationResult } = require("express-validator");
const User = require("../Models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const user = require("../Models/user");
const mailgun = require("mailgun-js");
const DOMAIN = "sandbox9b24365b3d6b4d748029f01d9b4e7936.mailgun.org";
const mg = mailgun({ apiKey: process.env.API_KEY, domain: DOMAIN });

const signin = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(Error("InValid Input", 422));
  }
  bcrypt.hash(req.body.password, 10, async (err, hash) => {
    if (err) {
      return res.status(500).json({ error: err });
    } else {
      const user = new User({
        name: req.body.name,
        email: req.body.email,
        password: hash,
      });
      const email = req.body.email;
      const existingUser = await User.findOne({ email }).exec();

      if (existingUser) {
        const error = new Error("User already exists", 500);
        return next(error);
      }

      await user
        .save()
        .then(() => {
          res.json({ user: user.toObject({ getters: true }) });
        })
        .catch((err) => {
          return next(new Error(err, 401));
        });
    }
  });
};

const login = async (req, res, next) => {
  User.find({ email: req.body.email })
    .exec()
    .then((user) => {
      if (user.length < 1) {
        return res.status(401).json({ message: "Auth Failed" });
      }
      bcrypt.compare(req.body.password, user[0].password, (err, result) => {
        if (err) {
          return res.status(401).json({ message: "Auth Failed" });
        }
        if (result) {
          const token = jwt.sign(
            {
              email: user[0].email,
              name: user[0].name,
            },
            process.env.JWT_KEY,
            {
              expiresIn: "1h",
            }
          );
          return res
            .status(200)
            .json({ message: "Auth Sucessfull", token: token });
        }
        res.status(401).json({ message: "Auth Failed" });
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ error: err });
    });
};

const forgotpassword = async (req, res, next) => {
  const email = req.body.email;
  const existingUser = await User.findOne({ email }).exec();

  if (existingUser) {
    const secret = process.env.JWT_KEY + existingUser.password;
    const payload = {
      email: existingUser.email,
      id: existingUser._id,
    };

    const token = jwt.sign(payload, secret, { expiresIn: "15m" });
    const link = `http:localhost:5000/resetPassword/${existingUser.id}/${token}`;
    res.json({ link });
    console.log(link);
    const data = {
      from: "saivarshith3041@gmail.com",
      to: email,
      subject: "Hello",
      html: `<p>your reset link <a href=${link}>Click Here</a></p>`,
    };
    mg.messages().send(data, function (error, body) {
      console.log(body);
    });
  } else {
    res.status(500).json({ message: "Email not registered" });
    return;
  }
};

const resetpassword = async (req, res, next) => {
  const { id, token } = req.params;

  const existingUser = await User.findOne({ _id: id }).exec();

  if (!existingUser) {
    res.json({ message: "Invalid Id" });
    return;
  }

  const secret = process.env.JWT_KEY + existingUser.password;
  try {
    const payload = jwt.verify(token, secret);
    const email = payload.email;
    const user = await User.findOne({ email }).exec();
    bcrypt.hash(req.body.password, 10, async (err, hash) => {
      if (err) {
        return res.status(500).json({ error: err });
      } else {
        user.password = hash;
        await user.save();
        console.log(user.password);
      }
    });
    res.json({ user });
  } catch (err) {
    res.status(401).json({ error: err });
  }
};

exports.signin = signin;
exports.login = login;
exports.forgotpassword = forgotpassword;
exports.resetpassword = resetpassword;
