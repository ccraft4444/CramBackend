const router = require("express").Router();
const express = require("express");
const bodyParser = require("body-parser");
const { asyncErrorHandler } = require("./utils");
const prisma = require("../prisma/prisma");
const stripe = require("stripe")(
  "sk_test_51MtxiHFQGhTdTKMrIoEm62jgVUkbMeHBhQlH6qD6OfTk3zOW5lioPvPQhGeKMgTPiUY0mAcfohEfEnRvyqxcveJI005zotch9J"
);
const endpointSecret = "whsec_7m9Is3TaNrNomxgGNpbQOtovxZxmFN4u";
const YOUR_DOMAIN = "http://localhost:4242";

// Add CORS middleware
router.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

router.use(
  express.json({
    limit: "5mb",
    verify: (req, res, buf) => {
      req.rawBody = buf.toString();
    },
  })
);

const tiers = [
  {
    name: "Basic",
    price: 0.99,
    credits: 1,
    priceId: "price_1MvpaqFQGhTdTKMrJgYDYhON",
  },
  {
    name: "Pro",
    price: 3.99,
    credits: 5,
    priceId: "price_1MvpbIFQGhTdTKMrmjHGF4h2",
  },
  {
    name: "Premium",
    price: 6.99,
    credits: 10,
    priceId: "price_1MvpbeFQGhTdTKMrYIpCsYGz",
  },
];

//  price id's: 10: price_1MvpbeFQGhTdTKMrYIpCsYGz
// 5: price_1MvpbIFQGhTdTKMrmjHGF4h2
// 1: price_1MvpaqFQGhTdTKMrJgYDYhON
// ${YOUR_DOMAIN}?canceled=true

// router.post("/create-checkout-session", async (req, res) => {
//   const { priceId, tierIndex } = req.body;
//   console.log("priceId in back", priceId);
//   const session = await stripe.checkout.sessions.create({
//     line_items: [
//       {
//         price: priceId,
//         quantity: 1,
//       },
//     ],
//     mode: "payment",
//     success_url: `http://localhost:5174/success?tierIndex=${tierIndex}`, // pass tierIndex in the success_url
//     cancel_url: `http://localhost:5174/purchase`,
//   });

//   res.json(session);
// });

router.post("/create-checkout-session", async (req, res) => {
  const { priceId, tierIndex, userId } = req.body;
  console.log("userId in back chek sesh:", userId, "tierIndex:", tierIndex);
  console.log("priceId in back", priceId);
  const session = await stripe.checkout.sessions.create({
    payment_intent_data: {
      metadata: {
        userId: userId.toString(),
        tierIndex: tierIndex.toString(),
      },
    },
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: "payment",

    success_url: `http://localhost:5173/success?tierIndex=${tierIndex}`, // pass tierIndex in the success_url
    cancel_url: `http://localhost:5173/purchase`,
  });

  res.json(session);
});

router.post(
  "/success",
  asyncErrorHandler(async (req, res) => {
    const { tier } = req.body;
    // update the user's credits based on the selected tier
    const newTotalCredits = req.user.credits + tier.credits;
    req.user.credits = newTotalCredits;
    await req.user.save();
    res.sendStatus(200);
  })
);

const verify = (req, _, buf, encoding) => {
  req.rawBody = buf.toString(encoding || "utf8");
};

// router.post(
//   "/webhook",
//   bodyParser.raw({ type: "application/json" }),
//   (req, res) => {
//     const sig = request.headers["stripe-signature"];
//     let event;

//     try {
//       event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
//     } catch (err) {
//       console.error(
//         `⚠️  Webhook signature verification failed. ${err.message}`
//       );
//       return res.status(400).send(`Webhook Error: ${err.message}`);
//     }

//     console.log("Headers:", req.headers);
//     console.log("body:", event);

//     // Handle the event
//     switch (event.type) {
//       case "payment_intent.succeeded":
//         const paymentIntent = event.data.object;
//         console.log(
//           `!!!!! Poop Poop PaymentIntent for ${paymentIntent.amount} was successful!`
//         );

//         const sessionId = paymentIntent.metadata.checkoutSessionId;
//         const session = stripe.checkout.sessions.retrieve(sessionId);
//         const { user, tierIndex } = session.metadata;

//         // Move the function outside of the switch statement
//         async function handlePaymentIntentSucceeded(
//           paymentIntent,
//           user,
//           tierIndex
//         ) {
//           console.log("!!!!! in handlepaymentintent");
//           const updatedUser = await prisma.users.update({
//             where: {
//               id: user.id,
//             },
//             data: { credits: user.credits + tierIndex },
//           });
//           console.log(updatedUser);
//         }

//         // Call the function
//         handlePaymentIntentSucceeded(paymentIntent, user, tierIndex);

//         break;
//       case "payment_method.attached":
//         const paymentMethod = event.data.object;
//         // Then define and call a method to handle the successful attachment of a PaymentMethod.
//         // handlePaymentMethodAttached(paymentMethod);
//         break;
//       default:
//         // Unexpected event type
//         console.log(`Unhandled event type ${event.type}.`);
//     }

//     // Return a 200 response to acknowledge receipt of the event
//     res.send();
//   }
// );

router.use("/webhook", async (req, res) => {
  const event = req.body;
  switch (event.type) {
    case "payment_intent.succeeded": {
      console.log("payment successful");
      const paymentIntent = event.data.object;
      console.log("paymentIntent.metadata:", paymentIntent.metadata);
      const userId = parseInt(paymentIntent.metadata.userId);
      const tierIndex = parseInt(paymentIntent.metadata.tierIndex);

      console.log("user id, tier index in hook", userId, tierIndex);
      const tier = tiers[tierIndex];
      updateUserCredits(userId, tier.credits);

      break;
    }

    default:
      return res.status(400).end();
  }
  res.json({ received: true });
});

async function updateUserCredits(userId, creditsToAdd) {
  const user = await prisma.users.findUnique({ where: { id: userId } });

  if (!user) {
    console.error(`User not found with ID ${userId}`);
    return;
  }

  const updatedUser = await prisma.users.update({
    where: { id: userId },
    data: { credits: user.credits + creditsToAdd },
  });

  console.log("User credits updated:", updatedUser);
}

module.exports = router;
