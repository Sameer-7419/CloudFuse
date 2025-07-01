import express from "express";
import bodyParser from "body-parser";
import connectDB from "./db/connect.js";
import dotenv from 'dotenv';
import authRouter from "./routes/auth.js";
import accountLinkingRouter from "./routes/accountLinking.js";
import fileUploadRouter from "./routes/fileUpload.js";
import cors from 'cors';

dotenv.config();

connectDB();

const app=express();

app.use(cors({
    origin: ["http://localhost:5000",
             "http://localhost:5001",   // Frontend running on 5001
             "http://localhost:5002",   // Frontend running on 5002
             "http://localhost:5173",   // Vite dev server (most common)
             "http://localhost:3000",   // Create React App
             "http://localhost:5174",], // Vite preview server
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type",
                    "Authorization",
                    "X-Requested-With",
                    "Accept",
                    "Origin"],
    credentials: true // Allow credentials if needed
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/auth",authRouter);
app.use("/api/account", accountLinkingRouter);
app.use("/api/files",fileUploadRouter);

app.listen(3000,()=>{
    console.log("Server is running on port 3000");
});