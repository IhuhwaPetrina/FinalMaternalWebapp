import bcrypt from "bcrypt"
import User from "../models/User.js"

// Get all users with statistics
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password")

    const stats = {
      total: users.length,
      active: users.filter((u) => u.isActive).length,
      inactive: users.filter((u) => !u.isActive).length,
      online: users.filter((u) => u.isOnline).length,
      nurses: users.filter((u) => u.role === "nurse").length,
      mothers: users.filter((u) => u.role === "mother").length,
    }

    res.status(200).json({ users, stats })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Register a nurse (admin only)
const registerNurse = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      rnNumber,
      specializations,
      facilityName,
      yearsOfExperience,
      licenseExpiryDate,
      picturePath,
      location,
    } = req.body

    // Check if nurse already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" })
    }

    const salt = await bcrypt.genSalt()
    const passwordHash = await bcrypt.hash(password, salt)

    const nurse = new User({
      firstName,
      lastName,
      email,
      password: passwordHash,
      role: "nurse",
      rnNumber,
      specializations: Array.isArray(specializations) ? specializations : [specializations],
      facilityName,
      yearsOfExperience,
      licenseExpiryDate,
      picturePath,
      location,
      isActive: true,
      profileViews: 0,
      impressions: 0,
    })

    await nurse.save()

    const nurseResponse = nurse.toObject()
    delete nurseResponse.password

    res.status(201).json(nurseResponse)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Deactivate user
const deactivateUser = async (req, res) => {
  try {
    const { userId } = req.params

    const user = await User.findByIdAndUpdate(userId, { isActive: false, isOnline: false }, { new: true }).select(
      "-password",
    )

    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    res.status(200).json(user)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Activate user
const activateUser = async (req, res) => {
  try {
    const { userId } = req.params

    const user = await User.findByIdAndUpdate(userId, { isActive: true }, { new: true }).select("-password")

    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    res.status(200).json(user)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params

    const user = await User.findByIdAndDelete(userId)

    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    res.status(200).json({ message: "User deleted successfully" })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Get online nurses
const getOnlineNurses = async (req, res) => {
  try {
    const nurses = await User.find({
      role: "nurse",
      isOnline: true,
      isActive: true,
    }).select("-password")

    res.status(200).json(nurses)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Get all mothers for nurses to contact
const getAllMothers = async (req, res) => {
  try {
    const mothers = await User.find({
      role: "mother",
      isActive: true,
    }).select("-password")

    res.status(200).json(mothers)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export { getAllUsers, registerNurse, deactivateUser, activateUser, deleteUser, getOnlineNurses, getAllMothers }
