import { v2 as cloudinary } from 'cloudinary'
import fs from "fs"



cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_NAME, 
    api_key: process.env.CLOUDINARY_KEY, 
    api_secret: process.env.CLOUDINARY_SECRET
    // Click 'View API Keys' above to copy your API secret
});


const uploadOnCloudinary = async (localFilePath) => {
    try {
        // console.log(localFilePath);
        if(!localFilePath) return null;
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "raw"        
        })
        console.log("File is uploaded", response.url);
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath) //remove the locally temp saved file
        return null;
    }
}

export default uploadOnCloudinary;