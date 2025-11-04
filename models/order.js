const mongoose = require("mongoose");

/** ---------------- Order Schema ---------------- **/
const orderSchema = new mongoose.Schema(
  {
    items: [
      {
        id: Number,
        name: String,
        price: Number,
        quantity: { type: Number, default: 1 },
        image: String,
      },
    ],
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: [
        "Order Placed",
        "Accepted",
        "Preparing",
        "Ready for Pickup",
        "Picked Up",
        "On the Way",
        "Delivered",
        "Cancelled",
        "Rejected"
      ],
      default: "Order Placed",
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
    assignedPartner: { type: mongoose.Schema.Types.ObjectId, ref: "DeliveryPartner", default: null },
    deliveryDetails: { eta: { type: String, default: null }, location: { type: String, default: null } },
  },
  { timestamps: true }
);

// ✅ Fix OverwriteModelError by checking if model already exists
const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);

module.exports = Order;
