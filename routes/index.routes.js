const express = require('express');
const authMiddleware = require('../middlewares/authe');
const router = express.Router();
const upload = require('../config/multer.config');
const fileModel = require('../models/files.models');
const cloudinary = require('../config/cloudinary.config'); // Fix double slash

// Landing page
router.get('/', async (req, res) => {
  res.render('start');
});

// Home page - show user's files
router.get('/home', authMiddleware, async (req, res) => {
  try {
    const userFiles = await fileModel.find({ user: req.user.userId });
    console.log("User Files:", JSON.stringify(userFiles, null, 2));
    res.render('home', { files: userFiles });
  } catch (err) {
    console.error("Error fetching user files:", err.message);
    // Send JSON instead
    res.status(500).json({ error: 'Upload Failed', message: err.message });

  }
});

// File upload route
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      throw new Error("No file received. Multer or Cloudinary failed.");
    }

    console.log("Request File:", JSON.stringify(req.file, null, 2));
    console.log("Request User:", JSON.stringify(req.user, null, 2));

    const secureUrl = req.file.path || req.file.secure_url || req.file.url;
    if (!secureUrl) {
      throw new Error("Cloudinary upload failed: secureUrl is undefined");
    }

    await fileModel.create({
      path: secureUrl,
      originalname: req.file.originalname?.toString(),
      user: req.user.userId,
    });

    res.redirect('/home');
  } catch (err) {
    console.error('Upload Error Stack:', err.stack);
    res.status(500).render('error', { message: err.message });
  }
});

// Download file route
router.get('/download/:id', authMiddleware, async (req, res) => {
  try {
    const file = await fileModel.findById(req.params.id);
    if (!file) {
      return res.status(404).render('error', { message: "File not found" });
    }

    const downloadUrl = file.path.replace('/upload/', '/upload/fl_attachment:');
    res.redirect(downloadUrl);
  } catch (err) {
    console.error("Download Error:", err.message);
    res.status(500).render('error', { message: "Download failed." });
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
