import jwt from "jsonwebtoken"

export const verifyToken = async (req, res, next) => {
  try {
    let token = req.header("Authorization")

    if (!token) {
      return res.status(403).json({ error: "Access Denied" })
    }

    if (token.startsWith("Bearer ")) {
      token = token.slice(7, token.length).trimLeft()
    }

    const verified = jwt.verify(token, process.env.JWT_SECRET || "secret-key")
    req.user = verified
    next()
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export const verifyAdmin = async (req, res, next) => {
  try {
    const User = (await import("../models/User.js")).default
    const user = await User.findById(req.user.id)

    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" })
    }

    next()
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export const verifyNurse = async (req, res, next) => {
  try {
    const User = (await import("../models/User.js")).default
    const user = await User.findById(req.user.id)

    if (!user || user.role !== "nurse") {
      return res.status(403).json({ error: "Nurse access required" })
    }

    next()
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
