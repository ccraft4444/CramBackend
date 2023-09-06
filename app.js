require("dotenv").config();
const cors = require("cors");
const express = require("express");
const path = require("path");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const app = express();
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const { COOKIE_SECRET } = process.env;
const routes = require("./routes");
const fileUpload = require("express-fileupload");

app.use(express.json());
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.urlencoded({ extended: false }));
app.use(morgan("dev"));
app.use(express.static(path.join(__dirname, "../client", "build")));
// app.use(express.static(path.join(__dirname, "client", "src")));
// app.use(express.static(path.join(__dirname, "./client", "dist")));
app.use(cookieParser(COOKIE_SECRET));
app.use(fileUpload()); // apply file upload middleware here

app.get("/health", (req, res) => {
  res.send("All Healthy Good to Go!");
});

// api route
app.use("/routes", routes);

app.use((req, res, next) => {
  res.sendFile(path.join(__dirname, "./client/dist", "index.html"));
});

app.use((error, req, res, next) => {
  res.status(500).send(error);
});

module.exports = app;
