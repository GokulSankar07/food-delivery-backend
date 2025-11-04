const express = require("express");
const router = express.Router();
const Order = require("../models/order");

// ---------------- Create a new order ----------------
router.post("/", async (req, res) => {
  try {
    const { items, total, user, restaurant } = req.body;

    if (!items || !items.length || !total || !user || !restaurant) {
      return res.status(400).json({ message: "Invalid order data" });
    }

    const newOrder = await Order.create({
      items,
      total,
      user,
      restaurant,
      status: "Order Placed",
    });

    // Emit live update to restaurant room
    const io = req.app.get("io");
    if (io) io.to(restaurant).emit("newOrder", newOrder);

    res.status(201).json(newOrder);
  } catch (err) {
    console.error("Order creation error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------------- Fetch orders by user ----------------
router.get("/user/:userId", async (req, res) => {
  try {
    const orders = await Order.find({ user: req.params.userId })
      .populate("restaurant", "restaurantName address")
      .populate("assignedPartner", "name email");
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------------- Fetch orders by restaurant ----------------
router.get("/restaurant/:restaurantId", async (req, res) => {
  try {
    const orders = await Order.find({ restaurant: req.params.restaurantId })
      .populate("user", "name email")
      .populate("assignedPartner", "name email");
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------------- Fetch orders by partner ----------------
router.get("/partner/:partnerId", async (req, res) => {
  try {
    const orders = await Order.find({ assignedPartner: req.params.partnerId })
      .populate("user", "name email")
      .populate("restaurant", "restaurantName address");
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
 
// ---------------- Assign partner to order ----------------
router.put("/:orderId/assignPartner", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { partnerId } = req.body;
    if (!partnerId) return res.status(400).json({ message: "partnerId is required" });

    const order = await Order.findByIdAndUpdate(
      orderId,
      { assignedPartner: partnerId },
      { new: true }
    )
      .populate("user", "name email")
      .populate("restaurant", "restaurantName address")
      .populate("assignedPartner", "name email");

    if (!order) return res.status(404).json({ message: "Order not found" });

    const io = req.app.get("io");
    if (io) {
      // Notify the assigned partner
      io.to(String(partnerId)).emit("newOrder", order);
      // Broadcast an update
      io.emit("orderUpdated", order);
    }

    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
