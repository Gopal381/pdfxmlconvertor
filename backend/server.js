import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import DBConnection from "./config/db.js";
import router from "./routes/user.js";
import conversionRouter from "./routes/conversionRoutes.js";
dotenv.config();
DBConnection();
const app =  express();
app.use(cors({
    origin: "http://localhost:5173", // Allow frontend
    credentials: true
}));
app.use(express.json());
app.use("/api", router);
app.use("/file", conversionRouter)
app.listen(8000, ()=>{
    console.log("Server is listening on port 8000!");
})