const router = require("express").Router();
const bcrypt = require("bcryptjs");
const { asyncErrorHandler } = require("./utils");
const prisma = require("../prisma/prisma");

const jwt = require("jsonwebtoken");
const SALT_ROUNDS = 10;

const { authRequired } = require("./utils");
router.post(
  "/register",
  asyncErrorHandler(async (req, res, next) => {
    const { email, password } = req.body;
    console.log("req body reg", req.body);
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    try {
      const createdUser = await prisma.users.create({
        data: { email: email, password: hashedPassword },
      });
      console.log("after prisma.create");
      delete createdUser.password;

      const token = jwt.sign(createdUser, process.env.JWT_SECRET);

      res.cookie("token", token, {
        sameSite: "strict",
        httpOnly: true,
        signed: true,
      });

      res.send(createdUser);
    } catch (error) {
      next(error);
    }
  })
);

router.post(
  "/login",
  asyncErrorHandler(async (req, res, next) => {
    const { email, password } = req.body;
    console.log("req body reg", req.body);

    const user = await prisma.users.findUnique({
      where: { email: email },
    });
    if (user) {
      console.log("user in login", user);
      const validPassword = await bcrypt.compare(password, user.password);

      console.log("valid pass", validPassword);

      if (validPassword) {
        const token = jwt.sign(user, process.env.JWT_SECRET);
        console.log("user", user);

        res.cookie("token", token, {
          sameSite: "strict",
          httpOnly: true,
          signed: true,
        });
        delete user.password;
        res.send(user);
      } else {
        next("invalid credentials");
      }
    } else {
      next("invalid credentials");
    }
  })
);

router.post(
  "/logout",
  asyncErrorHandler(async (req, res, next) => {
    res.clearCookie("token", {
      sameSite: "strict",
      httpOnly: true,
      signed: true,
    });
    res.send({
      loggedIn: false,
      message: "Logged Out",
    });
  })
);

router.get(
  "/",
  asyncErrorHandler(async (req, res, next) => {
    const users = await prisma.users.findMany();
    res.send(users);
  })
);

router.get(
  "/me",
  authRequired,
  asyncErrorHandler(async (req, res, next) => {
    res.send(req.user);
  })
);

router.patch(
  "/me",
  authRequired,
  asyncErrorHandler(async (req, res, next) => {
    const { email, password } = req.body;
    const updatedUser = await prisma.users.update({
      where: {
        id: req.user.id,
      },
      data: { email, password },
    });
    res.send(updatedUser);
  })
);

router.patch(
  "/me/credits",
  authRequired,
  asyncErrorHandler(async (req, res, next) => {
    const { credits } = req.body;
    const updatedUser = await prisma.users.update({
      where: {
        id: req.user.id,
      },
      data: { credits },
    });
    res.send(updatedUser);
  })
);

router.get(
  "/my_orders",
  authRequired,
  asyncErrorHandler(async (req, res, next) => {
    const myOrders = await prisma.orders.findMany({
      where: { userId: req.user.id },
    });
    res.send(myOrders);
  })
);

module.exports = router;
