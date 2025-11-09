import mongoose from "mongoose"
const Schema = mongoose.Schema

const UserSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
      min: 2,
      max: 50,
    },
    lastName: {
      type: String,
      required: true,
      min: 2,
      max: 50,
    },
    email: {
      type: String,
      required: true,
      max: 50,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      min: 5,
    },
    role: {
      type: String,
      enum: ["admin", "nurse", "mother"],
      required: true,
      default: "mother",
    },
    picturePath: {
      type: String,
      default: "",
    },
    rnNumber: {
      type: String,
      sparse: true, // Only required for nurses
    },
    specializations: [
      {
        type: String,
      },
    ],
    facilityName: {
      type: String,
    },
    yearsOfExperience: {
      type: Number,
    },
    licenseExpiryDate: {
      type: Date,
    },
    dueDate: {
      type: Date,
    },
    pregnancyWeek: {
      type: Number,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    friends: {
      type: Array,
      default: [],
    },
    location: String,
    occupation: String,
    profileViews: Number,
    impressions: Number,
  },
  { timestamps: true },
)

const User = mongoose.model("User", UserSchema)

export default User
