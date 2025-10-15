const mongoose = require("mongoose");

// Schema for menu items
const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
}, { _id: true });

// Schema for restaurants
const restaurantSchema = new mongoose.Schema({
  ownerName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  restaurantName: { type: String, required: true },
  address: { type: String, required: true },
  menu: [menuItemSchema],

  // Orders linked to this restaurant
  orders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],

  // Settings fields
  delivery: { type: Boolean, default: true },
  pickup: { type: Boolean, default: true },
  openTime: { type: String, default: "09:00" },
  closeTime: { type: String, default: "21:00" },
  cuisine: { type: [String], default: [] },
  minOrder: { type: Number, default: 0 },
  deliveryRadius: { type: Number, default: 5 },
  paymentMethods: {
    cash: { type: Boolean, default: true },
    card: { type: Boolean, default: false },
    upi: { type: Boolean, default: false },
  },
  description: { type: String, default: "" },
  instagram: { type: String, default: "" },
  facebook: { type: String, default: "" },
  isOpen: { type: Boolean, default: true },
}, { timestamps: true });

// Create model
const Restaurant = mongoose.model("Restaurant", restaurantSchema);

module.exports = Restaurant;
