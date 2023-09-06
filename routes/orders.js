const router = require("express").Router();
const { asyncErrorHandler } = require("./utils");
const prisma = require("../prisma/prisma");

router.get(
  "/",
  asyncErrorHandler(async (req, res, next) => {
    const orders = await prisma.orders.findMany();
    res.send(orders);
  })
);

router.get(
  "/me",
  asyncErrorHandler(async (req, res, next) => {
    const myOrders = await prisma.orders.findMany({
      where: { userId: req.user.id },
    });

    res.send(myOrders);
  })
);

router.get(
  "/:orderId",
  asyncErrorHandler(async (req, res, next) => {
    const singleOrder = await prisma.orders.findUnique({
      where: {
        id: +req.params.orderId,
      },
      include: {
        order_items: {
          include: {
            items: true,
          },
        },
      },
    });
    res.send(singleOrder);
  })
);

router.post(
  "/",
  asyncErrorHandler(async (req, res, next) => {
    const { userId, credits, price } = req.body;
    const createdOrder = await prisma.orders.create({
      data: { userId: userId, credits: credits, price: price },
    });

    res.send(createdOrder);
  })
);

module.exports = router;
