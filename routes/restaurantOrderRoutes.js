const express = require("express");
const router = express.Router();
const restaurantOrderController = require("../controllers/restaurantOrderController");

// Get all orders for a restaurant
router.get("/:restaurantId/orders", restaurantOrderController.getOrdersForRestaurant);

// Update order status (restaurant only)
router.put("/:orderId/status", restaurantOrderController.updateOrderStatus);


module.exports = router;
