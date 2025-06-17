const express = require('express');
const authMiddleware = require('../middlewares/authe');
const router = express.Router();
const upload = require('../config/multer.config');
const fileModel = require('../models/files.models');
const cloudinary = require('../config/cloudinary.config');
const streamifier = require('streamifier')
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

    // Cloudinary upload using buffer
    const streamUpload = (req) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'DriveAppFiles',
            use_filename: true,
            filename_override: req.file.originalname,
          },
          (error, result) => {
            if (result) resolve(result);
            else reject(error);
          }
        );
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });
    };

    const cloudinaryResponse = await streamUpload(req);

    console.log("☁️ Cloudinary Upload Response:", cloudinaryResponse);

    const fileUrl = cloudinaryResponse.secure_url;
    const publicId = cloudinaryResponse.public_id;

    if (!fileUrl) {
      throw new Error("Cloudinary upload did not return a secure_url");
    }

    const savedFile = await fileModel.create({
      path: fileUrl,
      originalname: req.file.originalname,
      public_id: publicId,
      user: req.user.userId
    });

    console.log("✅ File saved to DB:", savedFile);
    res.redirect('/home');

  } catch (err) {
    console.error("❌ Upload error:", {
      message: err.message,
      stack: err.stack,
      name: err.name,
    });

    res.status(500).json({
      error: "Upload Failed",
      details: err.message,
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
