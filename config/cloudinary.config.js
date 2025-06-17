require('dotenv').config();
const cloudinary = require('cloudinary').v2;


cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    // api_secret: process.env.CLOUDINARY_API_SECRET
});
console.log("cloud_name" ,process.env.CLOUDINARY_NAME)
console.log("key" ,process.env.CLOUDINARY_API_KEY)
console.log("api sec" ,process.env.CLOUDINARY_API_SECRET)
module.exports = cloudinary;
