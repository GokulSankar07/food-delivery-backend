// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const http = require("http");
const { Server } = require("socket.io");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();
console.log("dotenv loaded");

// Models
const User = require("./models/users");
const Order = require("./models/order");
const Restaurant = require("./models/restaurant");

// Routes
const userRoutes = require("./routes/userRoutes");
const orderRoutes = require("./routes/orderRoutes");
const restaurantRoutes = require("./routes/restaurantRoutes");
const partnerRoutes = require("./routes/partnerRoutes");
const restaurantOrderRoutes = require("./routes/restaurantOrderRoutes");

// ---------------- Initialize Express ----------------
const app = express();
app.use(express.json());
app.use(cors({
  origin: [
    /\.netlify\.app$/,
    "https://rad-sfogliatella-5d91d2.netlify.app",
    "https://shimmering-dasik-05e736.netlify.app",
    "https://glittery-croissant-c9ce00.netlify.app",
    "https://lustrous-pithivier-d15e72.netlify.app",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:3001",
    "http://localhost:5174"
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));


// ---------------- Root Route ----------------
app.get("/", (req, res) => {
  res.send("Backend is working!");
});

// ---------------- MongoDB Connection ----------------
const mongoURI = process.env.MONGO_URI;

if (!mongoURI) {
  console.error("❌ MONGO_URI is not set! Set it in Render Environment variables.");
  process.exit(1);
}

mongoose
  .connect(mongoURI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// ---------------- Create HTTP + Socket.IO Server ----------------
const server = http.createServer(app); // Only declare once
const io = new Server(server, {
  cors: {
    origin: "*", // Replace with frontend URL in production
    methods: ["GET", "POST"],
  },
});

// Attach io globally for controllers
app.set("io", io);

// ---------------- Socket.IO Events ----------------
io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);

  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);
  });

  socket.on("disconnect", (reason) => {
    console.log(`❌ Client disconnected (${socket.id}): ${reason}`);
  });
});

// ---------------- Routes ----------------
app.use("/api/users", userRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/partner", partnerRoutes);
app.use("/api/restaurantOrders", restaurantOrderRoutes); // only this one

// Customer auth routes are defined in routes/userRoutes.js

// Restaurant auth routes are defined in routes/restaurantRoutes.js

// ---------------- Restaurant Update Settings ----------------
app.post("/api/restaurants/update", async (req, res) => {
  try {
    const { _id, ...updateData } = req.body;
    if (!_id)
      return res
        .status(400)
        .json({ success: false, message: "Restaurant ID missing" });

    const updated = await Restaurant.findByIdAndUpdate(_id, updateData, {
      new: true,
    });
    if (!updated)
      return res
        .status(404)
        .json({ success: false, message: "Restaurant not found" });

    res.json({ success: true, restaurant: updated });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ---------------- Start Server ----------------
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

