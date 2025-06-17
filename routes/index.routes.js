const express = require('express');
const authMiddleware = require('../middlewares/authe');
const router = express.Router();
const upload = require('../config/multer.config');
const fileModel = require('../models/files.models');
const cloudinary = require('../config/cloudinary.config');

// Show start page
router.get('/', (req, res) => {
  res.render('start');
});

// Show files on home page
router.get('/home', authMiddleware, async (req, res) => {
  try {
    const userFiles = await fileModel.find({ user: req.user.userId });
    res.render('home', { files: userFiles });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).send("Internal Server Error");
  }
});

// Upload file
// File upload route
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    console.log("📥 Upload route triggered");

    if (!req.file) {
      throw new Error("No file received");
    }

    // Upload to Cloudinary
    const cloudinaryResponse = await cloudinary.uploader.upload(req.file.path, {
      folder: 'DriveAppFiles',
      use_filename: true,
    });

    console.log("☁️ Cloudinary Upload Response:", cloudinaryResponse);

    const fileUrl = cloudinaryResponse.secure_url;
    const publicId = cloudinaryResponse.public_id;

    if (!fileUrl) {
      throw new Error("Cloudinary upload did not return a secure_url");
    }

    // Save to MongoDB
    const savedFile = await fileModel.create({
      path: fileUrl,
      originalname: req.file.originalname,
      public_id: publicId,
      user: req.user.userId
    });

    console.log("✅ File saved to DB:", savedFile);

    res.redirect('/home');

  } catch (err) {
    const detailedError = {
      message: err.message,
      stack: err.stack,
      name: err.name,
    };

    console.error("❌ Upload error:", detailedError);

    res.status(500).json({
      error: "Upload Failed",
      details: detailedError
    });
  }
});

// Download
router.get('/download/:id', authMiddleware, async (req, res) => {
  try {
    const file = await fileModel.findById(req.params.id);
    if (!file) return res.status(404).send("File not found");

    const downloadUrl = file.path.replace('/upload/', '/upload/fl_attachment:');
    res.redirect(downloadUrl);
  } catch (err) {
    console.error("Download Error:", err);
    res.status(500).send("Download Failed");
  }
});

// Delete
router.delete('/delete/:id', authMiddleware, async (req, res) => {
  try {
    const file = await fileModel.findByIdAndDelete(req.params.id);
    if (!file) return res.status(404).send("File not found");
    res.status(200).send("Deleted");
  } catch (err) {
    console.error("Delete Error:", err);
    res.status(500).send("Delete Failed");
  }
});

module.exports = router;
