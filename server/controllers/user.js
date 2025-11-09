import User from "../models/User.js"
import bcrypt from "bcrypt"

// Get user profile
export const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params
    const user = await User.findById(userId).select("-password")

    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    res.status(200).json(user)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Update user profile
export const updateUserProfile = async (req, res) => {
  try {
    const { userId } = req.params
    const updates = req.body

    // Don't allow updating role, email, or password through this endpoint
    delete updates.role
    delete updates.email
    delete updates.password

    // Handle profile picture upload
    if (req.file) {
      updates.picturePath = req.file.filename
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updates, {
      new: true,
    }).select("-password")

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" })
    }

    res.status(200).json(updatedUser)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Change password
export const changePassword = async (req, res) => {
  try {
    const { userId } = req.params
    const { currentPassword, newPassword } = req.body

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password)
    if (!isMatch) {
      return res.status(400).json({ error: "Current password is incorrect" })
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(newPassword, salt)

    user.password = hashedPassword
    await user.save()

    res.status(200).json({ message: "Password updated successfully" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
