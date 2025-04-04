import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name : {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: [
          /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, 
          "Please enter a valid email address",
        ]
    },
    password: String,
});

const users = mongoose.model("User", userSchema);
export default users;