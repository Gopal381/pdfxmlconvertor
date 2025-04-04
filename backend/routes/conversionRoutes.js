import express from "express";
import { upload } from "../middlewares/multermiddleware.js";
import { uploadPDF, convertToXML, getConversionById, downloadXml, getUserConversions } from "../controllers/conversionController.js";
import authMiddleware from "../middlewares/authmiddleware.js";

const conversionRouter = express.Router();

// conversionRouter.get("/", (req, res) => {
//     res.status(201).json({
//         message: "File route is working"
//     });
// })
conversionRouter.post("/upload", authMiddleware, upload.single("pdf"), uploadPDF);
conversionRouter.post("/convert/:conversionId", authMiddleware, convertToXML);
conversionRouter.get('/:conversionId', getConversionById);
conversionRouter.get('/:conversionId/download', downloadXml);
conversionRouter.get("/", authMiddleware, getUserConversions);

export default conversionRouter;
