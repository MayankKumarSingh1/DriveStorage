require('dotenv').config();
const cloudinary = require('cloudinary').v2;


cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});
console.log("cloud_name" , cloudinary.cloud_name)
console.log("api " , cloudinary.api_key)
console.log("api sec" , cloudinary.api_secret)
module.exports = cloudinary;
