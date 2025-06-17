const express = require('express');
const authMiddleware = require('../middlewares/authe');
const router = express.Router();
const upload = require('../config/multer.config');
const fileModel = require('../models/files.models');
const cloudinary = require('../config/cloudinary.config');
const fs = require('fs'); // At the top


// Landing page
router.get('/', async (req, res) => {
  res.render('start');
});

// Home page - show user's files
router.get('/home', authMiddleware, async (req, res) => {
  try {
    const userFiles = await fileModel.find({ user: req.user.userId });
    console.log(" 1 User Files:", JSON.stringify(userFiles, null, 2));
    res.render('home', { files: userFiles });
  } catch (err) {
    console.error(" 2 Error fetching user files:", err.message);
    // Send JSON instead
    res.status(500).json({ error: ' 3 Upload Failed', message: err.message });

  }
});

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

    // Get secure_url safely from response
    const fileUrl = cloudinaryResponse.secure_url;
    const publicId = cloudinaryResponse.public_id;

    if (!fileUrl) {
      throw new Error("Cloudinary upload did not return a secure_url");
    }

    // Save to MongoDB
    const savedFile = await fileModel.create({
      path: fileUrl,
      originalname: req.file.originalname,
      public_id: publicId, // Optional but useful for deletion
      user: req.user.userId
    });

    console.log("✅ File saved to DB:", savedFile);

    // Clean up the uploaded local file
    fs.unlink(req.file.path, (err) => {
      if (err) {
        console.error("⚠️ Failed to delete local temp file:", err.message);
      }
    });

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




// Download file route
router.get('/download/:id', authMiddleware, async (req, res) => {
  try {
    const file = await fileModel.findById(req.params.id);
    if (!file) {
        return res.status(404).json({ message: "File not found" });
}

    const downloadUrl = file.path.replace('/upload/', '/upload/fl_attachment:');
    res.redirect(downloadUrl);
  } catch (err) {
    console.error("Download Error:", err.message);
  }
});

// Delete file route
router.delete('/delete/:id', authMiddleware, async (req, res) => {
  try {
    const file = await fileModel.findByIdAndDelete(req.params.id);
    if (!file) return res.status(404).send("File not found");
    res.status(200).send("File deleted");
  } catch (err) {
    console.error("Delete Error:", err.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;
