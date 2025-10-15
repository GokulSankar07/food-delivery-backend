const express = require("express");
const router = express.Router();
const Restaurant = require("../models/restaurant");
const Order = require("../models/order");
const bcrypt = require("bcryptjs");

// ---------------- Register ----------------
router.post("/register", async (req, res) => {
  try {
    const { ownerName, email, password, phone, restaurantName, address } = req.body;

    const existing = await Restaurant.findOne({ email });
    if (existing) return res.status(400).json({ message: "Restaurant already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newRestaurant = new Restaurant({
      ownerName,
      email,
      password: hashedPassword,
      phone,
      restaurantName,
      address,
      menu: [],
    });

    await newRestaurant.save();
    res.status(201).json({
      message: "Restaurant registered successfully",
      restaurant: newRestaurant,
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------------- Signin ----------------
router.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;

    const restaurant = await Restaurant.findOne({ email });
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

    const isMatch = await bcrypt.compare(password, restaurant.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid email or password" });

    res.json({
      message: "Login successful",
      restaurant: {
        _id: restaurant._id,
        ownerName: restaurant.ownerName,
        email: restaurant.email,
        phone: restaurant.phone,
        restaurantName: restaurant.restaurantName,
        address: restaurant.address,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------------- Get all restaurants ----------------
router.get("/", async (req, res) => {
  try {
    const restaurants = await Restaurant.find();
    res.json(restaurants);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ---------------- Add menu item ----------------
router.post("/:id/menu", async (req, res) => {
  try {
    const { name, price, category } = req.body;
    if (!name || !price || !category) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

    const newItem = { name, price, category };
    restaurant.menu.push(newItem);
    await restaurant.save();

    // Return the newly added menu item
    res.status(201).json(restaurant.menu[restaurant.menu.length - 1]);
  } catch (err) {
    console.error("Add menu error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------------- Get restaurant menu ----------------
router.get("/:id/menu", async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

    res.json({ menu: restaurant.menu || [] });
  } catch (err) {
    console.error("Get menu error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------------- Delete menu item ----------------
router.delete("/:id/menu/:itemId", async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

    restaurant.menu = restaurant.menu.filter(
      (item) => item._id.toString() !== req.params.itemId
    );
    await restaurant.save();

    res.json({ message: "Item deleted" });
  } catch (err) {
    console.error("Delete menu error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------------- Update menu item ----------------
router.put("/:id/menu/:itemId", async (req, res) => {
  try {
    const { name, price, category } = req.body;

    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

    const menuItem = restaurant.menu.id(req.params.itemId);
    if (!menuItem) return res.status(404).json({ message: "Menu item not found" });

    if (name) menuItem.name = name;
    if (price) menuItem.price = price;
    if (category) menuItem.category = category;

    await restaurant.save();

    res.json({ message: "Menu item updated", menuItem });
  } catch (err) {
    console.error("Update menu error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// ---------------- LIVE ORDER SUPPORT ----------------
// Add this route for updating order status with live updates
router.put("/orders/:orderId/status", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, partnerId } = req.body;
    const io = req.app.get("io"); // get socket instance

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.status = status;
    if (partnerId) order.partnerId = partnerId;

    await order.save();

    // Emit live updates
    if (order.customerId) io.to(order.customerId.toString()).emit("orderUpdated", order);
    if (order.restaurantId) io.to(order.restaurantId.toString()).emit("orderUpdated", order);
    if (order.partnerId) io.to(order.partnerId.toString()).emit("orderUpdated", order);

    res.json({ message: "Order status updated", order });
  } catch (err) {
    console.error("Update order status error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
