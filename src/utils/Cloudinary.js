const cloudinary = require('cloudinary').v2
const fs = require('fs')
const ApiError = require('./ApiError')

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_API_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload
const uploadOnCloudinary = async (localFilePath,isProduct=false) => {
    try {        
        if (!localFilePath) return null;
        
        // upload image to cloudinary    
        const response = await cloudinary.uploader.upload(localFilePath, {
            folder:`${isProduct ? "products/image": "userImage"}`,
            resource_type: 'image',
        })

        fs.unlinkSync(localFilePath); // delete local file after upload
        return response.secure_url; // return the URL of the uploaded image
    } catch (error) {
        fs.unlinkSync(localFilePath); // delete local file in case of error
        console.log("Error uploading to Cloudinary:", error.message);
        
        return null
    }
}

// extract public id
const getPublicIdFromURL = (url) => {
    try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split("/");
        const versionIndex = pathParts.findIndex(part => /^v\d+$/.test(part));
        const filePathParts = pathParts.slice(versionIndex + 1);
        const filePath = filePathParts.join("/");
        const dotIndex = filePath.lastIndexOf(".");
        const publicId = filePath.substring(0,dotIndex)
    
        return publicId
    } catch (error) {
        return null
    }
}

//Delete
const deleteFromCloudinary = async (url) => {
    try {
        if (!url) return null

        const publicId = getPublicIdFromURL(url)

        const result = await cloudinary.uploader.destroy(publicId)

        console.log("Deleted:", result);

    } catch (error) {
        throw new ApiError(401, error.message)
    }
}


module.exports = { uploadOnCloudinary, deleteFromCloudinary }