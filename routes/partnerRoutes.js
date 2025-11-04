// routes/partnerRoutes.js
const express = require("express");
const router = express.Router();
const partnerController = require("../controllers/partnerController");
const DeliveryPartner = require("../models/partner");

// Auth Routes
router.post("/signup", partnerController.signup);
router.post("/login", partnerController.login);

// List all delivery partners (minimal fields)
router.get("/", async (req, res) => {
  try {
    const partners = await DeliveryPartner.find({}, "name email");
    res.json(partners || []);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Partner Order Routes
// RESTful: partnerId first, then resource
router.get("/:partnerId/orders", partnerController.getOrders);
router.put("/orders/:orderId/deliver", partnerController.markDelivered);
router.put("/orders/:orderId/status", partnerController.updateStatus);

module.exports = router;
