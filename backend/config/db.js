import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
const DBConnection = async()=>{
    const MONGODB_URL = process.env.MONGO_URI;
    try {
        await mongoose.connect(MONGODB_URL);
        console.log("DB Connected successfully");
    } catch(error) {
        console.log("Error Connecting :" + error)
    }
};

export default DBConnection;