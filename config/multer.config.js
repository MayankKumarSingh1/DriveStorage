const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./cloudinary.config');

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'upload',
        resource_type: 'auto',
    }
});
console.log("multer")

const upload = multer({ storage });

module.exports = upload;
