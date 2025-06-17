const express = require('express');
const authMiddleware = require('../middlewares/authe');
const router = express.Router();
const upload = require('../config/multer.config');
const fileModel = require('../models/files.models');
const cloudinary = require('../config/cloudinary.config');
const streamifier = require('streamifier')
const crypto = require('crypto');

const generateSignature = (params, apiSecret) => {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');

  const signature = crypto
    .createHash('sha1')
    .update(sortedParams + apiSecret)
    .digest('hex');

  return signature;
};

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

router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) throw new Error("No file received");

    const timestamp = Math.floor(Date.now() / 1000);

    const uploadOptions = {
      folder: 'DriveAppFiles',
      timestamp,
    };

    const signature = generateSignature(uploadOptions, process.env.CLOUDINARY_API_SECRET);

    const cloudinaryStreamUpload = () => {
      return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            folder: uploadOptions.folder,
            timestamp: uploadOptions.timestamp,
            api_key: process.env.CLOUDINARY_API_KEY,
            signature,
          },
          (error, result) => {
            if (result) resolve(result);
            else reject(error);
          }
        ).end(req.file.buffer);
      });
    };

    const uploadResponse = await cloudinaryStreamUpload();

    const savedFile = await fileModel.create({
      path: uploadResponse.secure_url,
      originalname: req.file.originalname,
      public_id: uploadResponse.public_id,
      user: req.user.userId
    });

    res.redirect('/home');

  } catch (err) {
    console.error("❌ Upload error:", {
      message: err.message,
      stack: err.stack,
      name: err.name,
    });

    res.status(500).json({
      error: "Upload Failed",
      details: err.message
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
