const cloudinary = require("cloudinary").v2;
require("dotenv").config();

console.log("Cloudinary Config", process.env.CLOUD_NAME, process.env.CLOUD_API_KEY);

module.exports = cloudinary;
