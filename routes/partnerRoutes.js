// routes/partnerRoutes.js
const express = require("express");
const router = express.Router();
const partnerController = require("../controllers/partnerController");

// Auth Routes
router.post("/signup", partnerController.signup);
router.post("/login", partnerController.login);

// Partner Order Routes
// RESTful: partnerId first, then resource
router.get("/:partnerId/orders", partnerController.getOrders);
router.put("/orders/:orderId/deliver", partnerController.markDelivered);

module.exports = router;
