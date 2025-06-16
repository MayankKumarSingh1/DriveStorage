const express = require('express')
const authMiddleware = require('../middlewares/authe')
const router = express.Router();
const upload = require('../config/multer.config')
const fileModel = require('../models/files.models');
const cloudinary = require('..//config/cloudinary.config')

router.get('/',async (req, res)=>{
    res.render('start');
});


router.get('/home',authMiddleware,async (req,res)=>{

    const userFiles =await fileModel.find({
        user:req.user.userId
    })

    console.log(userFiles)

    res.render('home',{
        files:userFiles
    })
})

router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    console.log('Uploaded File:', req.file);

    const secureUrl = req.file?.path || req.file?.secure_url || req.file?.url;

    if (!secureUrl) {
      throw new Error("File not uploaded correctly to Cloudinary");
    }

    await fileModel.create({
      path: cloudinaryResponse.secure_url,
      originalname: req.file.originalname,
      user: req.user.userId,
    });
    console.log('Uploaded File:', req.file);


    res.redirect('/home');
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Upload Failed' });
  }
});


router.get('/download/:id', authMiddleware, async (req, res) => {
    const file = await fileModel.findById(req.params.id);

    if (!file) {
        return res.status(404).json({ message: "File not found" });
    }

    const downloadUrl = file.path.replace('/upload/', '/upload/fl_attachment:');

    res.redirect(downloadUrl);
});


router.delete('/delete/:id', async (req, res) => {
  try {
    const file = await fileModel.findByIdAndDelete(req.params.id);
    if (!file) return res.status(404).send("File not found");
    res.status(200).send("File deleted");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

module.exports = router; 