# MaternalConnect - Complete Setup Guide

A comprehensive maternal health communication platform with admin management, nurse portals, mother portals, real-time chat, and video calling.

## Features

### Admin Dashboard
- User management (view, activate, deactivate, delete)
- Nurse registration with detailed credentials
- Real-time statistics (total users, active/inactive, online users)
- Search and filter users

### Nurse Portal
- Upload health materials (PDF, PPTX, DOCX, URLs)
- Categorize educational content
- Track views and downloads
- Real-time chat with mothers
- Video calling with mothers

### Mother Portal
- Browse health materials by category
- View online nurses
- Real-time chat with nurses
- Video calling with nurses
- Download educational resources

### Real-time Features
- Socket.io powered chat
- Typing indicators
- Online/offline status
- Message read receipts

### Video Calling
- Jitsi Meet integration (free, no API key required)
- HD video and audio
- Screen sharing
- Chat during calls

## Prerequisites

- Node.js 18+ and npm
- MongoDB (local or Atlas)

## Installation

### 1. Server Setup

\`\`\`bash
cd server
npm install
\`\`\`

Create `server/.env`:
\`\`\`env
MONGO_URL=mongodb://localhost:27017/maternal-app
# Or use MongoDB Atlas:
# MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/maternal-app

PORT=3001
JWT_SECRET=your-super-secret-jwt-key-change-this
CLIENT_URL=http://localhost:3000
\`\`\`

Start the server:
\`\`\`bash
npm start
# Or for development with auto-reload:
npm run dev
\`\`\`

### 2. Client Setup

\`\`\`bash
# In the root directory
npm install
\`\`\`

Create `.env.local`:
\`\`\`env
NEXT_PUBLIC_API_URL=http://localhost:3001
\`\`\`

Start the client:
\`\`\`bash
npm run dev
\`\`\`

## Creating the First Admin

You need to manually create an admin user in MongoDB:

### Option 1: Using MongoDB Compass or Atlas UI
1. Connect to your database
2. Go to the `users` collection
3. Insert a new document:

\`\`\`json
{
  "firstName": "Admin",
  "lastName": "User",
  "email": "admin@maternalconnect.com",
  "password": "$2b$10$YourHashedPasswordHere",
  "role": "admin",
  "isActive": true,
  "isOnline": false,
  "profileViews": 0,
  "impressions": 0,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
\`\`\`

### Option 2: Using MongoDB Shell
\`\`\`javascript
use maternal-app

// First, hash a password using bcrypt (you can use an online tool or Node.js)
// For password "admin123", the hash is:
// $2b$10$rQZ9vXqK5xJ8YGxKp0xqXeF7VqYqK5xJ8YGxKp0xqXeF7VqYqK5xJ

db.users.insertOne({
  firstName: "Admin",
  lastName: "User",
  email: "admin@maternalconnect.com",
  password: "$2b$10$rQZ9vXqK5xJ8YGxKp0xqXeF7VqYqK5xJ8YGxKp0xqXeF7VqYqK5xJ",
  role: "admin",
  isActive: true,
  isOnline: false,
  profileViews: 0,
  impressions: 0,
  createdAt: new Date(),
  updatedAt: new Date()
})
\`\`\`

### Option 3: Create a Script
Create `server/scripts/create-admin.js`:

\`\`\`javascript
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const UserSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  password: String,
  role: String,
  isActive: Boolean,
  isOnline: Boolean,
  profileViews: Number,
  impressions: Number,
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    
    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash('admin123', salt);
    
    const admin = new User({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@maternalconnect.com',
      password: passwordHash,
      role: 'admin',
      isActive: true,
      isOnline: false,
      profileViews: 0,
      impressions: 0,
    });
    
    await admin.save();
    console.log('Admin created successfully!');
    console.log('Email: admin@maternalconnect.com');
    console.log('Password: admin123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createAdmin();
\`\`\`

Run it:
\`\`\`bash
cd server
node scripts/create-admin.js
\`\`\`

## Usage

### 1. Admin Login
- Go to `http://localhost:3000/admin/login`
- Login with admin credentials
- Register nurses from the dashboard

### 2. Nurse Login
- Go to `http://localhost:3000/nurse/login`
- Login with credentials provided by admin
- Upload health materials
- Chat with mothers

### 3. Mother Registration & Login
- Go to `http://localhost:3000/register`
- Register as a mother
- Login at `http://localhost:3000/login`
- Browse materials, chat with nurses

## Project Structure

\`\`\`
maternal-app/
├── server/
│   ├── controllers/
│   │   ├── auth.js          # Authentication logic
│   │   ├── admin.js         # Admin operations
│   │   ├── materials.js     # Health materials
│   │   └── messages.js      # Chat messages
│   ├── models/
│   │   ├── User.js          # User schema
│   │   ├── HealthMaterial.js
│   │   └── Message.js
│   ├── middleware/
│   │   └── auth.js          # JWT verification
│   ├── public/
│   │   ├── assets/          # Profile pictures
│   │   └── materials/       # Uploaded files
│   ├── index.js             # Server entry point
│   └── package.json
├── app/
│   ├── admin/
│   │   ├── login/
│   │   └── dashboard/
│   ├── nurse/
│   │   ├── login/
│   │   └── dashboard/
│   ├── mother/
│   │   └── dashboard/
│   ├── chat/[userId]/
│   ├── video-call/[userId]/
│   ├── login/
│   └── register/
├── components/
│   ├── admin/
│   ├── nurse/
│   └── mother/
├── lib/
│   ├── api.ts               # API functions
│   ├── auth-context.tsx     # Auth state
│   └── socket.ts            # Socket.io client
└── package.json
\`\`\`

## Troubleshooting

### Server won't start
- Check MongoDB is running
- Verify `.env` file exists with correct values
- Check port 3001 is not in use

### Client won't connect to server
- Verify server is running on port 3001
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Check CORS settings in server

### Chat not working
- Verify Socket.io connection in browser console
- Check server logs for Socket.io connections
- Ensure both users are logged in

### Video calls not working
- Check internet connection
- Allow camera/microphone permissions
- Try a different browser (Chrome/Firefox recommended)

## Production Deployment

### Server (Vercel, Railway, or any Node.js host)
1. Set environment variables
2. Deploy server code
3. Note the server URL

### Client (Vercel)
1. Set `NEXT_PUBLIC_API_URL` to server URL
2. Deploy Next.js app

### Database (MongoDB Atlas)
1. Create cluster
2. Get connection string
3. Update `MONGO_URL` in server

## Security Notes

- Change `JWT_SECRET` to a strong random string
- Use HTTPS in production
- Enable MongoDB authentication
- Set up proper CORS origins
- Use environment variables for all secrets

## Support

For issues or questions, check the code comments or create an issue in the repository.
