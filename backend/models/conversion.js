import mongoose from "mongoose";

// const conversionSchema = new mongoose.Schema({
//     pdfName: { type: String, required: true },
//     pdfUrl: { type: String, required: true }, // Store Cloudinary URL
//     xmlData: { type: String },
//     createdAt: { type: Date, default: Date.now }
// });


const conversionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    pdfName: { type: String, required: true },
    pdfUrl: { type: String, required: true }, // Store Cloudinary URL
    xmlUrl: { type: String, required: false},
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Conversion", conversionSchema);
