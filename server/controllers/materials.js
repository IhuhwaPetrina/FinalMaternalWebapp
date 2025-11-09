import HealthMaterial from "../models/HealthMaterial.js"

// Upload health material
const uploadMaterial = async (req, res) => {
  try {
    const { title, description, category, fileType, url, uploadedBy, videoDuration } = req.body

    const files = req.files || {}
    const filePath = files.file?.[0]?.filename || null
    const videoPath = files.video?.[0]?.filename || null

    if (fileType === "url" && !url) {
      return res.status(400).json({ error: "URL is required for URL type materials" })
    }

    if (fileType === "video" && !videoPath) {
      return res.status(400).json({ error: "Video file is required for video type materials" })
    }

    if (fileType !== "url" && fileType !== "video" && !filePath) {
      return res.status(400).json({ error: "File is required for file type materials" })
    }

    const material = new HealthMaterial({
      title,
      description,
      category,
      fileType,
      filePath,
      videoPath,
      url,
      uploadedBy,
      videoDuration: videoDuration ? Number.parseInt(videoDuration) : undefined,
    })

    await material.save()

    const populatedMaterial = await HealthMaterial.findById(material._id).populate(
      "uploadedBy",
      "firstName lastName picturePath",
    )

    res.status(201).json(populatedMaterial)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Get all materials
const getAllMaterials = async (req, res) => {
  try {
    const { category } = req.query

    const filter = category ? { category } : {}

    const materials = await HealthMaterial.find(filter)
      .populate("uploadedBy", "firstName lastName picturePath")
      .sort({ createdAt: -1 })

    res.status(200).json(materials)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Get material by ID
const getMaterialById = async (req, res) => {
  try {
    const { id } = req.params

    const material = await HealthMaterial.findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true }).populate(
      "uploadedBy",
      "firstName lastName picturePath",
    )

    if (!material) {
      return res.status(404).json({ error: "Material not found" })
    }

    res.status(200).json(material)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Increment download count
const incrementDownload = async (req, res) => {
  try {
    const { id } = req.params

    const material = await HealthMaterial.findByIdAndUpdate(id, { $inc: { downloads: 1 } }, { new: true })

    if (!material) {
      return res.status(404).json({ error: "Material not found" })
    }

    res.status(200).json(material)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// Delete material
const deleteMaterial = async (req, res) => {
  try {
    const { id } = req.params

    const material = await HealthMaterial.findByIdAndDelete(id)

    if (!material) {
      return res.status(404).json({ error: "Material not found" })
    }

    res.status(200).json({ message: "Material deleted successfully" })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export { uploadMaterial, getAllMaterials, getMaterialById, incrementDownload, deleteMaterial }
