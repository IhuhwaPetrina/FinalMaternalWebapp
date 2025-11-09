import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import dotenv from "dotenv"
import multer from "multer"
import helmet from "helmet"
import morgan from "morgan"
import path from "path"
import { fileURLToPath } from "url"
import { createServer } from "http"
import { Server } from "socket.io"
import { register, login, logout } from "./controllers/auth.js"
import {
  getAllUsers,
  registerNurse,
  deactivateUser,
  activateUser,
  deleteUser,
  getOnlineNurses,
  getAllMothers,
} from "./controllers/admin.js"
import {
  uploadMaterial,
  getAllMaterials,
  getMaterialById,
  incrementDownload,
  deleteMaterial,
} from "./controllers/materials.js"
import { sendMessage, getConversation, getUserConversations, markAsRead } from "./controllers/messages.js"
import { getUserProfile, updateUserProfile, changePassword } from "./controllers/user.js"
import { verifyToken, verifyAdmin, verifyNurse } from "./middleware/auth.js"
import User from "./models/User.js"
import Message from "./models/Message.js"
import fs from "fs"

/* CONFIGURATIONS */
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config()

const uploadDirs = [
  path.join(__dirname, "public", "assets"),
  path.join(__dirname, "public", "materials"),
  path.join(__dirname, "public", "videos"),
]

uploadDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
    console.log(`✓ Created directory: ${dir}`)
  }
})

const app = express()
const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
})

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(helmet())
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }))
app.use(morgan("common"))
app.use(cors())
app.use("/assets", express.static(path.join(__dirname, "public", "assets")))
app.use("/materials", express.static(path.join(__dirname, "public", "materials")))
app.use("/videos", express.static(path.join(__dirname, "public", "videos")))

/** FILE STORAGE */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = "public/materials"
    if (file.fieldname === "picture") {
      uploadPath = "public/assets"
    } else if (file.fieldname === "video" || file.mimetype?.startsWith("video/")) {
      uploadPath = "public/videos"
    }
    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    cb(null, uniqueSuffix + "-" + file.originalname)
  },
})

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "video/mp4",
    "video/webm",
    "video/ogg",
    "video/quicktime",
    "image/jpeg",
    "image/png",
  ]

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error("Invalid file type. Only PDF, DOCX, PPTX, and video files are allowed."))
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
})

/**
 * AUTH ROUTES
 */
app.post("/auth/register", upload.single("picture"), register)
app.post("/auth/login", login)
app.post("/auth/logout", logout)

/**
 * ADMIN ROUTES
 */
app.get("/admin/users", verifyToken, verifyAdmin, getAllUsers)
app.post("/admin/nurse", verifyToken, verifyAdmin, upload.single("picture"), registerNurse)
app.patch("/admin/users/:userId/deactivate", verifyToken, verifyAdmin, deactivateUser)
app.patch("/admin/users/:userId/activate", verifyToken, verifyAdmin, activateUser)
app.delete("/admin/users/:userId", verifyToken, verifyAdmin, deleteUser)

/**
 * NURSE ROUTES
 */
app.get("/nurses/online", verifyToken, getOnlineNurses)
app.get("/mothers/all", verifyToken, verifyNurse, getAllMothers)

/**
 * HEALTH MATERIALS ROUTES
 */
app.post(
  "/materials",
  verifyToken,
  verifyNurse,
  upload.fields([
    { name: "file", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  uploadMaterial,
)
app.get("/materials", verifyToken, getAllMaterials)
app.get("/materials/:id", verifyToken, getMaterialById)
app.patch("/materials/:id/download", verifyToken, incrementDownload)
app.delete("/materials/:id", verifyToken, verifyNurse, deleteMaterial)

/**
 * MESSAGES ROUTES
 */
app.post("/messages", verifyToken, sendMessage)
app.get("/messages/conversation/:userId1/:userId2", verifyToken, getConversation)
app.get("/messages/user/:userId", verifyToken, getUserConversations)
app.patch("/messages/read", verifyToken, markAsRead)
app.get("/messages/unread/:userId", verifyToken, async (req, res) => {
  try {
    const { userId } = req.params
    const requestingUserId = req.user?.id || req.user?._id

    if (requestingUserId !== userId) {
      return res.status(403).json({ error: "Access denied" })
    }

    const unreadCount = await Message.countDocuments({
      receiverId: userId,
      isRead: false,
    })

    const unreadByUser = await Message.aggregate([
      {
        $match: {
          receiverId: userId,
          isRead: false,
        },
      },
      {
        $group: {
          _id: "$senderId",
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "sender",
        },
      },
      {
        $unwind: "$sender",
      },
      {
        $project: {
          senderId: "$_id",
          count: 1,
          senderName: {
            $concat: ["$sender.firstName", " ", "$sender.lastName"],
          },
          senderPicture: "$sender.picturePath",
        },
      },
    ])

    res.status(200).json({
      totalUnread: unreadCount,
      unreadByUser,
    })
  } catch (err) {
    console.error("Get unread count error:", err)
    res.status(500).json({ error: "Failed to fetch unread count" })
  }
})

/**
 * USER PROFILE ROUTES
 */
app.get("/users/:userId", verifyToken, getUserProfile)
app.patch("/users/:userId", verifyToken, upload.single("picture"), updateUserProfile)
app.patch("/users/:userId/password", verifyToken, changePassword)

/**
 * SOCKET.IO FOR REAL-TIME CHAT AND VIDEO CALLS
 */
// Online users tracking
const onlineUsers = new Map()

io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id)

  // User goes online
  socket.on("user-online", async (userId) => {
    try {
      const previousSocketId = onlineUsers.get(userId)

      if (previousSocketId && previousSocketId !== socket.id) {
        console.log(`♻️ User ${userId} reconnecting - updating socket from ${previousSocketId} to ${socket.id}`)
      }

      onlineUsers.set(userId, socket.id)

      await User.findByIdAndUpdate(userId, {
        isOnline: true,
        lastSeen: new Date(),
      })

      console.log(`✅ User ${userId} is now online (socket: ${socket.id})`)
      console.log(`📊 Currently online users (${onlineUsers.size}):`, Array.from(onlineUsers.keys()))

      // Broadcast to all clients that this user is online
      io.emit("user-status-change", {
        userId,
        isOnline: true,
      })
    } catch (error) {
      console.error("Error setting user online:", error)
    }
  })

  // Video Call Events
  socket.on("call-request", async (data) => {
    console.log("📞 CALL REQUEST from", data.from, "to", data.to)
    console.log("📦 CALL REQUEST DATA:", data)
    console.log(`📊 Online users (${onlineUsers.size}):`, Array.from(onlineUsers.keys()))

    const receiverSocketId = onlineUsers.get(data.to)

    if (receiverSocketId) {
      // User is online - send incoming call notification
      console.log(`✅ RECEIVER IS ONLINE - Sending call to socket: ${receiverSocketId}`)

      try {
        // Get caller info from database
        const caller = await User.findById(data.from).select("firstName lastName picturePath")

        const callerData = {
          from: data.from,
          callerFirstName: caller?.firstName || data.callerFirstName,
          callerLastName: caller?.lastName || data.callerLastName,
          callerImage: caller?.picturePath
            ? `${process.env.API_BASE_URL || "http://localhost:3001"}/assets/${caller.picturePath}`
            : data.callerImage,
          roomUrl: data.roomUrl,
        }

        console.log("📞 Sending incoming-call event with data:", callerData)

        // Send to specific receiver
        io.to(receiverSocketId).emit("incoming-call", callerData)
        console.log("✅ Call notification sent successfully")
      } catch (error) {
        console.error("Error fetching caller info:", error)
        io.to(receiverSocketId).emit("incoming-call", data)
      }
    } else {
      // User is offline - notify caller
      console.log(`❌ User ${data.to} is NOT in online users map - sending offline notification`)
      console.log(`📊 Available online users:`, Array.from(onlineUsers.entries()))
      socket.emit("user-offline", { userId: data.to })
    }
  })

  socket.on("accept-call", (data) => {
    console.log("✅ CALL ACCEPTED by", data.from, "for", data.to)
    const initiatorSocketId = onlineUsers.get(data.to)
    if (initiatorSocketId) {
      console.log(`✅ Notifying caller ${data.to} that call was accepted`)
      io.to(initiatorSocketId).emit("call-accepted", {
        from: data.from,
      })
    } else {
      console.log(`🔴 Caller ${data.to} is no longer online`)
    }
  })

  socket.on("reject-call", (data) => {
    console.log("❌ CALL REJECTED by", data.from, "for", data.to)
    const initiatorSocketId = onlineUsers.get(data.to)
    if (initiatorSocketId) {
      console.log(`❌ Notifying caller ${data.to} that call was rejected`)
      io.to(initiatorSocketId).emit("call-rejected", {
        from: data.from,
      })
    } else {
      console.log(`🔴 Caller ${data.to} is no longer online`)
    }
  })

  socket.on("end-call", (data) => {
    console.log("📞 CALL ENDED by", data.from, "for", data.to)
    const receiverSocketId = onlineUsers.get(data.to)
    if (receiverSocketId) {
      console.log(`📞 Notifying receiver ${data.to} that call ended`)
      io.to(receiverSocketId).emit("call-ended", {
        from: data.from,
      })
    } else {
      console.log(`🔴 Receiver ${data.to} is no longer online`)
    }
  })

  // WebRTC signaling events for peer-to-peer video calls
  socket.on("webrtc-offer", (data) => {
    console.log("📤 Forwarding WebRTC offer to", data.to)
    const receiverSocketId = onlineUsers.get(data.to)
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("webrtc-offer", {
        from: data.from,
        offer: data.offer,
      })
    }
  })

  socket.on("webrtc-answer", (data) => {
    console.log("📤 Forwarding WebRTC answer to", data.to)
    const receiverSocketId = onlineUsers.get(data.to)
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("webrtc-answer", {
        from: data.from,
        answer: data.answer,
      })
    }
  })

  socket.on("webrtc-ice-candidate", (data) => {
    console.log("📤 Forwarding ICE candidate to", data.to)
    const receiverSocketId = onlineUsers.get(data.to)
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("webrtc-ice-candidate", {
        from: data.from,
        candidate: data.candidate,
      })
    }
  })

  // Handle disconnection
  socket.on("disconnect", async (reason) => {
    console.log("🔴 User disconnected:", socket.id, "Reason:", reason)

    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId)
        try {
          await User.findByIdAndUpdate(userId, {
            isOnline: false,
            lastSeen: new Date(),
          })
          io.emit("user-status-change", { userId, isOnline: false })
          console.log(`🔴 User ${userId} is now offline`)
        } catch (error) {
          console.error("Error setting user offline:", error)
        }
        break
      }
    }

    console.log(`📊 Remaining online users (${onlineUsers.size}):`, Array.from(onlineUsers.keys()))
  })

  // Handle connection errors
  socket.on("connect_error", (error) => {
    console.error("Socket connection error:", error)
  })

  // New message event for real-time message notifications
  socket.on("send-message", async (data) => {
    const { senderId, receiverId, message } = data
    const receiverSocketId = onlineUsers.get(receiverId)

    if (receiverSocketId) {
      try {
        // Get sender info for notification
        const sender = await User.findById(senderId).select("firstName lastName picturePath")

        // Send notification to receiver
        io.to(receiverSocketId).emit("new-message-notification", {
          senderId: senderId,
          senderName: `${sender.firstName} ${sender.lastName}`,
          senderImage: sender.picturePath
            ? `${process.env.API_BASE_URL || "http://localhost:3001"}/assets/${sender.picturePath}`
            : null,
          message: message,
          timestamp: new Date(),
        })

        console.log(`📬 Sent message notification to ${receiverId}`)
      } catch (error) {
        console.error("Error sending message notification:", error)
      }
    }
  })

  // Added cancel-call event handler for missed call notifications
  socket.on("cancel-call", async (data) => {
    console.log("🔕 CALL CANCELLED by", data.from, "to", data.to, "- sending missed call notification")
    const receiverSocketId = onlineUsers.get(data.to)

    if (receiverSocketId) {
      console.log(`📬 Sending missed call notification to ${data.to}`)
      io.to(receiverSocketId).emit("missed-call-notification", {
        callerId: data.from,
        callerName: data.callerName,
        callerImage: data.callerImage,
        timestamp: new Date(),
      })
    } else {
      console.log(`🔴 Receiver ${data.to} is no longer online for missed call notification`)
    }
  })
})

/***
 * MONGOOSE SETUP
 */
const PORT = process.env.PORT || 3001
mongoose
  .connect(process.env.MONGO_URL || "mongodb://localhost:27017/maternal-app")
  .then(() => {
    console.log("✓ Connected to MongoDB successfully")
    httpServer.listen(PORT, () => {
      console.log(`✓ Server started on port ${PORT}`)
    })
  })
  .catch((err) => {
    console.error("✗ MongoDB connection error:", err.message)
    process.exit(1)
  })
