const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./cloudinary.config');

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'upload',
        allowed_formats: ['jpg', 'png', 'jpeg', 'pdf', 'mp4']
    }
});

const upload = multer({ storage });

module.exports = upload;
