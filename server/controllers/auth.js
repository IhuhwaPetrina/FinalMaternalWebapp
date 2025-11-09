import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import User from "../models/User.js"

const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, picturePath, location, dueDate, pregnancyWeek } = req.body

    const salt = await bcrypt.genSalt()
    const passwordHash = await bcrypt.hash(password, salt)

    const user = new User({
      firstName,
      lastName,
      email,
      password: passwordHash,
      role: "mother",
      picturePath,
      location,
      dueDate,
      pregnancyWeek,
      profileViews: 0,
      impressions: 0,
    })

    await user.save()

    // Don't send password back
    const userResponse = user.toObject()
    delete userResponse.password

    res.status(201).json(userResponse)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const login = async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ error: "User does not exist" })
    }

    if (!user.isActive) {
      return res.status(403).json({ error: "Account is deactivated. Please contact admin." })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" })
    }

    // Update online status
    user.isOnline = true
    user.lastSeen = new Date()
    await user.save()

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "secret-key")

    const userResponse = user.toObject()
    delete userResponse.password

    res.status(200).json({ token, user: userResponse })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const logout = async (req, res) => {
  try {
    const { userId } = req.body

    await User.findByIdAndUpdate(userId, {
      isOnline: false,
      lastSeen: new Date(),
    })

    res.status(200).json({ message: "Logged out successfully" })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export { register, login, logout }
