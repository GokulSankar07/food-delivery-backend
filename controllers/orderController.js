import Order from "../models/order.js";
import User from "../models/user.js";
import Restaurant from "../models/restaurant.js";
// Create a new order
export const createOrder = async (req, res) => {
  try {
    const { items, total, user, restaurant } = req.body;

    if (!items || items.length === 0 || !user || !restaurant) {
      return res.status(400).json({ message: "Missing required order info" });
    }

    // Create order
    const newOrder = new Order({
      items,
      total,
      status: "Order Placed",
      user,
      restaurant,
    });

    await newOrder.save();
 // Push order into User.orders
    await User.findByIdAndUpdate(user, { $push: { orders: newOrder._id } });

    // Push order into Restaurant.orders
    await Restaurant.findByIdAndUpdate(restaurant, { $push: { orders: newOrder._id } });

    res.status(201).json(newOrder);
  } catch (err) {
    console.error("Error creating order:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get order by ID
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "username email")
      .populate("restaurant", "restaurantName address");
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (err) {
    console.error("Error fetching order:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all orders for a specific restaurant
export const getOrdersByRestaurant = async (req, res) => {
  try {
    const restaurantId = req.params.restaurantId;
    const orders = await Order.find({ restaurant: restaurantId })
      .populate("user", "username email"); // include user info
    res.json(orders);
  } catch (err) {
    console.error("Error fetching restaurant orders:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update order status (for restaurant dashboard)
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.status = status;
    await order.save();

    const updatedOrder = await Order.findById(order._id).populate("user", "username email");
    res.json(updatedOrder);
  } catch (err) {
    console.error("Error updating order status:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all orders for a specific user (optional)
export const getOrdersByUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const orders = await Order.find({ user: userId })
      .populate("restaurant", "restaurantName address");
    res.json(orders);
  } catch (err) {
    console.error("Error fetching user orders:", err);
    res.status(500).json({ message: "Server error" });
  }
};