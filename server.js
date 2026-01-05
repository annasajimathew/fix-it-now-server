const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const workerRoutes = require("./routes/workerRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const chatRoutes = require("./routes/chatRoutes");

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// static folder for images
app.use("/uploads", express.static("uploads"));

// routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/workers", workerRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/chat", chatRoutes);

// test route
app.get("/", (req, res) => {
  res.send("API WORKING");
});

// db
connectDB();

// server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
