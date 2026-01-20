const jwt = require("jsonwebtoken")
const User = require("../models/userModel")

const protect = async (req, res, next) => {
  let token

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1]

      const decoded = jwt.verify(token, process.env.JWT_SECRET)

      // ✅ FIX HERE (support both id & _id)
      const userId = decoded.id || decoded._id

      req.user = await User.findById(userId).select("-password")

      if (!req.user) {
        return res.status(401).json({ message: "User not found" })
      }

      next()
    } catch (error) {
      return res.status(401).json({ message: "Not authorized, token failed" })
    }
  }

  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" })
  }
}

module.exports = protect
