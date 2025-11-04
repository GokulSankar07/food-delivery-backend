const express = require("express");
const router = express.Router();
const Restaurant = require("../models/restaurant");
const bcrypt = require("bcryptjs");
const Order = require("../models/order");

// ---------------- List all restaurants ----------------
router.get("/", async (req, res) => {
  try {
    const restaurants = await Restaurant.find({}, "restaurantName address ownerName");
    res.json(restaurants || []);
  } catch (err) {
    console.error("List restaurants error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------------- Register ----------------
router.post("/register", async (req, res) => {
  try {
    const { ownerName, email, password, phone, restaurantName, address } = req.body;

    if (!ownerName || !email || !password || !phone || !restaurantName || !address) {
      return res.status(400).json({ message: "All fields are required" });
    }

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

    res.json({ message: "Login successful", restaurant });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------------- Update restaurant settings ----------------
router.put("/:id/settings", async (req, res) => {
  try {
    const restaurantId = req.params.id;
    const updateData = req.body;

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

    const allowedFields = [
      "restaurantName",
      "ownerName",
      "email",
      "phone",
      "address",
      "delivery",
      "pickup",
      "openTime",
      "closeTime",
      "cuisine",
      "minOrder",
      "deliveryRadius",
      "paymentMethods",
      "description",
      "instagram",
      "facebook",
      "isOpen",
    ];

    allowedFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        restaurant[field] = updateData[field];
      }
    });

    await restaurant.save();
    res.json({ success: true, restaurant });
  } catch (err) {
    console.error("Update settings error:", err);
    res.status(500).json({ message: "Server error" });
  }
});
// ---------------- Get menu ----------------
router.get("/:id/menu", async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });
    res.json({ menu: restaurant.menu });
  } catch (err) {
    console.error("Error fetching menu:", err);
    res.status(500).json({ message: "Server error fetching menu" });
  }
});

// ---------------- Add menu item ----------------
router.post("/:id/menu", async (req, res) => {
  try {
    const { name, price, category } = req.body;
    if (!name || !price || !category)
      return res.status(400).json({ message: "All fields are required" });

    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

    const menuItem = { name, price, category };
    restaurant.menu.push(menuItem);
    await restaurant.save();

    res.status(201).json({ message: "Menu item added", menuItem: restaurant.menu.at(-1) });
  } catch (err) {
    console.error("Error adding menu item:", err);
    res.status(500).json({ message: "Server error adding menu item" });
  }
});

// ---------------- Update menu item ----------------
router.put("/:id/menu/:itemId", async (req, res) => {
  try {
    const { name, price, category } = req.body;
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

    const item = restaurant.menu.id(req.params.itemId);
    if (!item) return res.status(404).json({ message: "Menu item not found" });

    if (name) item.name = name;
    if (price) item.price = price;
    if (category) item.category = category;

    await restaurant.save();
    res.json({ message: "Menu item updated", menuItem: item });
  } catch (err) {
    console.error("Error updating menu item:", err);
    res.status(500).json({ message: "Server error updating menu item" });
  }
});

// ---------------- Delete menu item ----------------
router.delete("/:id/menu/:itemId", async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

    const item = restaurant.menu.id(req.params.itemId);
    if (!item) return res.status(404).json({ message: "Menu item not found" });

    item.remove();
    await restaurant.save();
    res.json({ message: "Menu item deleted" });
  } catch (err) {
    console.error("Error deleting menu item:", err);
    res.status(500).json({ message: "Server error deleting menu item" });
  }
});
// ---------------- Get all orders for a restaurant ----------------
// __define-ocg__ fetch all orders linked to a restaurant
router.get("/:id/orders", async (req, res) => {
  try {
    const varOcg = req.params.id; // 👈 restaurantId
    const varFiltersCg = {}; // for future filters (status, date range, etc.)

    const orders = await Order.find({ restaurant: varOcg }) // 👈 match restaurant
      .populate("user", "name email") // get basic user info
      .sort({ createdAt: -1 });

    res.json({ success: true, orders });
  } catch (err) {
    console.error("Error fetching restaurant orders:", err);
    res.status(500).json({ message: "Server error fetching restaurant orders" });
  }
});

module.exports = router;
