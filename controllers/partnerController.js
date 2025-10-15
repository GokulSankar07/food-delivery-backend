const DeliveryPartner = require("../models/partner");
const bcrypt = require("bcryptjs");
const Order = require("../models/order");

// Signup
const signup = async (req, res) => {
  try {
    const { name, email, password, phone, vehicleNumber, address } = req.body;
    const existing = await DeliveryPartner.findOne({ email });
    if (existing) return res.status(400).json({ message: "Partner already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const partner = new DeliveryPartner({
      name,
      email,
      password: hashedPassword,
      phone,
      vehicleNumber,
      address,
    });

    await partner.save();
    res.status(201).json({ message: "Signup Successful", partner });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const partner = await DeliveryPartner.findOne({
  email: { $regex: new RegExp(`^${email}$`, "i") },
});

    if (!partner) return res.status(400).json({ message: "Partner not found" });

    const isMatch = await bcrypt.compare(password, partner.password);
    if (!isMatch) return res.status(400).json({ message: "Incorrect password" });

    res.json({ message: "Login Successful", partner });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get all orders for a partner
const getOrders = async (req, res) => {
  try {
    const { partnerId } = req.params;
    const orders = await Order.find({ assignedPartner: partnerId });
    // Return empty array if no orders
    res.json(orders || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Mark order as delivered
const markDelivered = async (req, res) => {
  try {
    const { orderId } = req.params;
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { status: "Delivered" },
      { new: true }
    );
    if (!updatedOrder) return res.status(404).json({ message: "Order not found" });

    // Emit update via Socket.IO
    const io = req.app.get("io");
    io.emit("orderUpdated", updatedOrder);

    res.json(updatedOrder); // return updated order directly
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { signup, login, getOrders, markDelivered };
