const express = require("express");
const bodyparser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(bodyparser.json());
mongoose
  .connect(
    "mongodb+srv://klaus:" +
      process.env.MONGODB_PW +
      "@hr-portal.kx5ek.mongodb.net/user-authentication?retryWrites=true&w=majority"
  )
  .then(() => {
    console.log("MONGO CONNECTED");
  });

const userRoute = require("./Routes/UserRoutes");

// app.use(cors);

app.use("/", userRoute);

app.use((req, res, next) => {
  const error = new Error("Couldn't find this route");
  error.status = 404;
  return next(error);
});

app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({ error: { message: error.message } });
});

module.exports = app;
