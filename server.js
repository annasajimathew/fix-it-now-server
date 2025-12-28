const express = require("express")
const mongoose = require("mongoose")
const dotenv = require("dotenv")
const cors = require("cors")

dotenv.config()

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// Routes
const authRoutes = require("./routes/authRoutes")

app.use("/api/auth", authRoutes)

// Test route (VERY IMPORTANT)
app.get("/", (req, res) => {
  res.send("FixItNow Backend Running")
})

// MongoDB
mongoose
  .connect(process.env.ATLASDBCONNECTION)
  .then(() => {
    console.log("MongoDB Connected")
  })
  .catch((err) => {
    console.log(err)
  })

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
