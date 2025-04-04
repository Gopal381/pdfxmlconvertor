import uploadOnCloudinary from "../utils/cloudinary.js";
import Conversion from "../models/conversion.js";
import xml2js from "xml2js"
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import PDFParser from "pdf2json";


const uploadPDF = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });

        // Upload PDF to Cloudinary
        const cloudinaryResponse = await uploadOnCloudinary(req.file.path);
        if (!cloudinaryResponse) return res.status(500).json({ error: "Cloudinary upload failed" });

        // Remove local temp file
        fs.unlinkSync(req.file.path);

        // Save to DB
        const newConversion = await Conversion.create({
            userId: req.user.id,
            pdfName: req.file.originalname,
            pdfUrl: cloudinaryResponse.secure_url, // Store Cloudinary URL
            createdAt: new Date()
        });

        res.status(201).json({ message: "PDF uploaded successfully", data: newConversion });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// import uploadOnCloudinary from "../utils/cloudinary.js";
// import Conversion from "../models/conversion.js";
// import fs from "fs";

// export const uploadPDF = async (req, res) => {
//     try {
//         if (!req.file) return res.status(400).json({ error: "No file uploaded" });

//         // Upload PDF to Cloudinary
//         // console.log(req.file.path);
//         const cloudinaryResponse = await uploadOnCloudinary(req.file.path);
//         // console.log(cloudinaryResponse);
//         if (!cloudinaryResponse) return res.status(500).json({ error: "Cloudinary upload failed" });

//         // Remove local temp file
//         fs.unlinkSync(req.file.path);

//         // Save to DB
//         const newConversion = await Conversion.create({
//             pdfName: req.file.originalname,
//             pdfUrl: cloudinaryResponse.secure_url, // Store Cloudinary URL
//             createdAt: new Date()
//         });

//         res.status(201).json({ message: "PDF uploaded successfully", data: newConversion });

//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// const convertToXML = async (req, res) => {
//     try {
//         const { conversionId } = req.params;
//         const conversion = await Conversion.findById(conversionId);

//         if (!conversion) return res.status(404).json({ error: "Conversion record not found" });

//         // Extract text from the Cloudinary PDF
//         const xmlData = await extractTextFromPDF(conversion.pdfUrl);
//         console.log(xmlData)
//         // Save XML to a temporary file
//         const tempPath = `./temp/${Date.now()}.xml`;
//         fs.writeFileSync(tempPath, xmlData);
        
//         // Upload to Cloudinary
//         const uploadResponse = await uploadOnCloudinary(tempPath);
//         fs.unlinkSync(tempPath); // Delete local file after upload

//         // Update DB with extracted XML data
//         conversion.xmlUrl = uploadResponse.url;
//         await conversion.save();

//         res.status(200).json({ message: "PDF converted to XML", data: conversion });
//     } catch (error) {
//         // console.log("error here", error);
//         res.status(500).json({ error: error.message });
//     }
// };


const convertToXML = async (req, res) => {
    try {
        const { conversionId } = req.params;
        const conversion = await Conversion.findById(conversionId);
        if (!conversion) return res.status(404).json({ error: "Conversion record not found" });

        // Extract text, paragraphs, and tables from PDF
        const { paragraphs, tables } = await extractTextFromPDF(conversion.pdfUrl);

        // Convert to XML
        const builder = new xml2js.Builder();
        const xmlData = builder.buildObject({ root: { Paragraphs: paragraphs, Tables: tables } });
        console.log(xmlData);
        // Save XML locally
        const tempPath = path.join(__dirname, `../temp/${Date.now()}.xml`);
        fs.writeFileSync(tempPath, xmlData);

        // Upload to Cloudinary
        const uploadResponse = await uploadOnCloudinary(tempPath);
        fs.unlinkSync(tempPath); // Delete after upload

        // Update DB with XML URL
        conversion.xmlUrl = uploadResponse.url;
        await conversion.save();

        res.status(200).json({ message: "PDF converted to XML", data: conversion });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Function to extract text from PDF
// const extractTextFromPDF = (pdfUrl) => {
//     return new Promise(async (resolve, reject) => {
//         try {
//             // Download PDF from Cloudinary
//             const fileName = path.basename(pdfUrl);
//             const localPath = path.join(__dirname, '../temp', fileName);
//             console.log(pdfUrl);
//             const response = await axios({
//                 url: pdfUrl,
//                 responseType: 'stream',
//             });

//             const writer = fs.createWriteStream(localPath);
//             response.data.pipe(writer);

//             writer.on('finish', () => {
//                 // Now process the local PDF
//                 const pdfParser = new PDFParser();
//                 pdfParser.loadPDF(localPath);

//                 pdfParser.on("pdfParser_dataReady", (pdfData) => {
//                     // Delete the local file after processing
//                     fs.unlinkSync(localPath);
//                     resolve(JSON.stringify(pdfData, null, 2));
//                 });

//                 pdfParser.on("pdfParser_dataError", (err) => {
//                     fs.unlinkSync(localPath);
//                     reject(err);
//                 });
//             });

//             writer.on('error', (err) => reject(err));

//         } catch (error) {
//             // console.log("I am error", error);
//             reject(error);
//         }
//     });
// };


const extractTextFromPDF = (pdfUrl) => {
    return new Promise(async (resolve, reject) => {
        try {
            const fileName = path.basename(pdfUrl);
            const localPath = path.join(__dirname, '../temp', fileName);
            console.log(pdfUrl);

            const response = await axios({ url: pdfUrl, responseType: 'stream' });
            const writer = fs.createWriteStream(localPath);
            response.data.pipe(writer);

            writer.on('finish', () => {
                const pdfParser = new PDFParser();
                pdfParser.loadPDF(localPath);

                pdfParser.on("pdfParser_dataReady", (pdfData) => {
                    fs.unlinkSync(localPath);

                    let paragraphs = [];
                    let tables = [];
                    let lastY = null;
                    let currentRow = [];

                    pdfData.Pages.forEach(page => {
                        page.Texts.forEach(text => {
                            let decodedText = decodeURIComponent(text.R.map(r => r.T).join(' '));
                            let y = text.y.toFixed(2);

                            // Detect paragraph break
                            if (lastY && Math.abs(lastY - y) > 0.5) {
                                if (currentRow.length > 0) {
                                    paragraphs.push(currentRow.join(' '));
                                    currentRow = [];
                                }
                            }

                            // Detect table (aligned text)
                            if (currentRow.length > 0 && Math.abs(lastY - y) < 0.2) {
                                currentRow.push(decodedText);
                            } else {
                                if (currentRow.length > 0) tables.push([...currentRow]);
                                currentRow = [decodedText];
                            }

                            lastY = y;
                        });

                        if (currentRow.length > 0) {
                            paragraphs.push(currentRow.join(' '));
                        }
                    });

                    resolve({ paragraphs, tables });
                });

                pdfParser.on("pdfParser_dataError", (err) => {
                    fs.unlinkSync(localPath);
                    reject(err);
                });
            });

            writer.on('error', (err) => reject(err));

        } catch (error) {
            reject(error);
        }
    });
};



const getConversionById = async (req, res) => {
    try {
        const { conversionId } = req.params;
        const conversion = await Conversion.findById(conversionId);
        if (!conversion) return res.status(404).json({ message: "Conversion not found" });

        res.json({ xmlUrl: conversion.xmlUrl });
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};


const downloadXml = async (req, res) => {
    try {
        const { conversionId } = req.params;
        const conversion = await Conversion.findById(conversionId);
        if (!conversion) return res.status(404).json({ message: "Conversion not found" });

        if (!conversion.xmlUrl) return res.status(404).json({ message: "XML file not found" });

        // Fetch XML content from Cloudinary
        const response = await axios.get(conversion.xmlUrl, { responseType: "arraybuffer" });

        // Set headers for download
        res.setHeader("Content-Disposition", `attachment; filename="converted.xml"`);
        res.setHeader("Content-Type", "application/xml");

        // Send file content
        res.send(response.data);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

const getUserConversions = async (req, res) => {
    try {
        const userId = req.user.id; // Ensure auth middleware sets req.user
        const conversions = await Conversion.find({ userId }).sort({ createdAt: -1 });
        res.status(200).json(conversions);
    } catch (error) {
        res.status(500).json({ message: "Error fetching conversions", error });
    }
};


export {uploadPDF, convertToXML, getConversionById, downloadXml, getUserConversions};