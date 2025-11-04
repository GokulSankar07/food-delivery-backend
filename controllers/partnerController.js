const DeliveryPartner = require("../models/partner");
const bcrypt = require("bcryptjs");
const Order = require("../models/order");

// -------------------- Signup --------------------
const signup = async (req, res) => {
  try {
    // Trim and normalize inputs
    const name = req.body.name?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password?.trim();
    const phone = req.body.phone?.trim();
    const vehicleNumber = req.body.vehicleNumber?.trim();
    const address = req.body.address?.trim();

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const existing = await DeliveryPartner.findOne({ email });
    if (existing) return res.status(400).json({ message: "Partner already exists" });

    const partner = new DeliveryPartner({
      name,
      email,
      // Let the model pre-save hook hash this
      password,
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

// -------------------- Login --------------------
const login = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password?.trim();

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const partner = await DeliveryPartner.findOne({
      email: { $regex: new RegExp(`^${email}$`, "i") },
    });

    if (!partner) return res.status(400).json({ message: "Partner not found" });

    let isMatch = false;

    // ✅ Check hashed password (support $2a/$2b/$2y variants)
    if (partner.password.startsWith("$2")) {
      isMatch = await bcrypt.compare(password, partner.password);
    } else {
      // Fallback for old plaintext password (tolerate extra spaces stored)
      if (partner.password.trim() === password) {
        isMatch = true;
        // Let pre-save hook hash it once (avoid double-hashing)
        partner.password = password;
        await partner.save();
        console.log(`✅ Converted plaintext password to hashed for ${partner.email}`);
      }
    }

    // Debug logs
    console.log("Login attempt:", email);
    console.log("Partner found:", partner ? true : false);
    console.log("Password match:", isMatch);

    if (!isMatch) return res.status(400).json({ message: "Incorrect password" });

    // Send only necessary partner info (avoid sending password)
    const partnerData = {
      _id: partner._id,
      name: partner.name,
      email: partner.email,
      phone: partner.phone,
      vehicleNumber: partner.vehicleNumber,
      address: partner.address,
    };

    res.json({ message: "Login Successful", partner: partnerData });
  } catch (err) {
    console.error("Partner login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


// -------------------- Get all orders for a partner --------------------
const getOrders = async (req, res) => {
  try {
    const { partnerId } = req.params;
    const orders = await Order.find({ assignedPartner: partnerId });
    res.json(orders || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// -------------------- Mark order as delivered --------------------
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

    res.json(updatedOrder);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { signup, login, getOrders, markDelivered };

// -------------------- Update order status (Picked Up, On the Way, Delivered) --------------------
const updateStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, partnerId } = req.body;

    if (!status) return res.status(400).json({ message: "status is required" });
    const allowed = ["Accepted", "Picked Up", "On the Way", "Delivered"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Basic guard: ensure the same assigned partner (no auth middleware available here)
    if (partnerId && String(order.assignedPartner) !== String(partnerId)) {
      return res.status(403).json({ message: "Not allowed for this partner" });
    }

    // Validate transition
    const current = order.status;
    const validTransitions = {
      "Order Placed": ["Accepted"],
      Accepted: ["Picked Up"],
      "Picked Up": ["On the Way"],
      "On the Way": ["Delivered"],
    };
    const nexts = validTransitions[current] || [];
    if (!nexts.includes(status)) {
      return res.status(400).json({ message: `Invalid transition from ${current} to ${status}` });
    }

    order.status = status;
    const saved = await order.save();

    // Emit socket updates
    const io = req.app.get("io");
    if (io) io.emit("orderUpdated", saved);

    res.json(saved);
  } catch (err) {
    console.error("updateStatus error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports.updateStatus = updateStatus;
