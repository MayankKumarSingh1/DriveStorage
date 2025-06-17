const express = require('express');
const authMiddleware = require('../middlewares/authe');
const router = express.Router();
const upload = require('../config/multer.config');
const fileModel = require('../models/files.models');
const cloudinary = require('../config/cloudinary.config');
const fs = require('fs');

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
router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) throw new Error("No file received");

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'DriveAppFiles',
      use_filename: true
    });

    await fileModel.create({
      path: result.secure_url,
      originalname: req.file.originalname,
      public_id: result.public_id,
      user: req.user.userId
    });

    fs.unlinkSync(req.file.path);
    res.redirect('/home');
  } catch (err) {
    console.error("Upload Error:", err);
    res.status(500).send("Upload Failed");
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
