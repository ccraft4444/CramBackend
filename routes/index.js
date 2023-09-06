const router = require("express").Router();

router.use("/users", require("./users"));
router.use("/documents", require("./documents"));
router.use("/payments", require("./payments"));
router.use("/langChain", require("./langChain"));

module.exports = router;
