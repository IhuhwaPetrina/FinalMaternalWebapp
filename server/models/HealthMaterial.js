import mongoose from "mongoose"
const Schema = mongoose.Schema

const HealthMaterialSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "Prenatal Care",
        "Nutrition",
        "Exercise",
        "Mental Health",
        "Labor & Delivery",
        "Postpartum Care",
        "Newborn Care",
        "Breastfeeding",
        "General Health",
        "Other",
      ],
    },
    fileType: {
      type: String,
      required: true,
      enum: ["pdf", "pptx", "docx", "url", "video"],
    },
    filePath: {
      type: String, // For uploaded files
    },
    videoPath: {
      type: String, // For uploaded videos
    },
    url: {
      type: String, // For external URLs
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    downloads: {
      type: Number,
      default: 0,
    },
    videoDuration: {
      type: Number, // Duration in seconds
    },
    thumbnailPath: {
      type: String, // Thumbnail for video preview
    },
  },
  { timestamps: true },
)

const HealthMaterial = mongoose.model("HealthMaterial", HealthMaterialSchema)

export default HealthMaterial
