import mongoose from "mongoose"
import bcrypt from "bcrypt"
import "dotenv/config"
import User from "../models/User.js"

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL || "mongodb://localhost:27017/maternal-app")
    console.log("Connected to MongoDB")

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: "admin@maternal.com" })
    if (existingAdmin) {
      console.log("Admin user already exists!")
      console.log("Email: admin@maternal.com")
      process.exit(0)
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash("admin123", salt)

    // Create admin user
    const admin = new User({
      firstName: "Admin",
      lastName: "User",
      email: "admin@maternal.com",
      password: hashedPassword,
      role: "admin",
      isActive: true,
      createdAt: new Date(),
    })

    await admin.save()
    console.log("✅ Admin user created successfully!")
    console.log("-----------------------------------")
    console.log("Email: admin@maternal.com")
    console.log("Password: admin123")
    console.log("-----------------------------------")
    console.log("⚠️  Please change the password after first login!")

    process.exit(0)
  } catch (error) {
    console.error("Error creating admin:", error)
    process.exit(1)
  }
}

createAdmin()
