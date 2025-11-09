import express from "express"
import Message from "../models/Message.js"
import { verifyToken } from "../middleware/auth.js"

const router = express.Router()
router.use(verifyToken)

// Send message
const sendMessage = async (req, res) => {
  try {
    const { senderId, receiverId, message } = req.body

    const newMessage = new Message({
      senderId,
      receiverId,
      message,
    })

    await newMessage.save()

    const populatedMessage = await Message.findById(newMessage._id)
      .populate("senderId", "firstName lastName picturePath role")
      .populate("receiverId", "firstName lastName picturePath role")

    res.status(201).json(populatedMessage)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Get conversation between two users
const getConversation = async (req, res) => {
  try {
    const { userId1, userId2 } = req.params

    const messages = await Message.find({
      $or: [
        { senderId: userId1, receiverId: userId2 },
        { senderId: userId2, receiverId: userId1 },
      ],
    })
      .populate("senderId", "firstName lastName picturePath role")
      .populate("receiverId", "firstName lastName picturePath role")
      .sort({ createdAt: 1 })

    res.status(200).json(messages)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Get all conversations for a user
const getUserConversations = async (req, res) => {
  try {
    const { userId } = req.params

    const messages = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
    })
      .populate("senderId", "firstName lastName picturePath role isOnline")
      .populate("receiverId", "firstName lastName picturePath role isOnline")
      .sort({ createdAt: -1 })

    // Get unique conversations
    const conversationsMap = new Map()

    messages.forEach((msg) => {
      const otherUserId =
        msg.senderId._id.toString() === userId ? msg.receiverId._id.toString() : msg.senderId._id.toString()

      if (!conversationsMap.has(otherUserId)) {
        conversationsMap.set(otherUserId, {
          user: msg.senderId._id.toString() === userId ? msg.receiverId : msg.senderId,
          lastMessage: msg,
          unreadCount: 0,
        })
      }

      // Count unread messages
      if (msg.receiverId._id.toString() === userId && !msg.isRead) {
        conversationsMap.get(otherUserId).unreadCount++
      }
    })

    const conversations = Array.from(conversationsMap.values())

    res.status(200).json(conversations)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Mark messages as read
const markAsRead = async (req, res) => {
  try {
    const { senderId, receiverId } = req.body

    await Message.updateMany({ senderId, receiverId, isRead: false }, { isRead: true, readAt: new Date() })

    res.status(200).json({ message: "Messages marked as read" })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Export the router, not individual functions
export default router

export { sendMessage, getConversation, getUserConversations, markAsRead }
