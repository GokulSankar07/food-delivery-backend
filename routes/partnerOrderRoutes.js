const express = require("express");
const router = express.Router();
const Order = require("../models/order");

// ✅ Get all orders assigned to this delivery partner
router.get("/:partnerId/orders", async (req, res) => {
  try {
    const { partnerId } = req.params;
    const orders = await Order.find({ assignedPartner: partnerId })
      .populate("user", "name email")
      .populate("restaurant", "name");

    if (!orders.length) {
      return res.status(404).json({ message: "No orders found for this partner" });
    }

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Update order status (e.g. "On the Way", "Delivered")
router.put("/:orderId/status", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = ["On the Way", "Delivered"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status update" });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ message: `Order marked as ${status}`, updatedOrder });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
