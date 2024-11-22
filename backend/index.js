import express from "express";
import dotenv from "dotenv";
import cors from "cors"
import cookieParser from "cookie-parser";
import path from "path";

import { connectDB } from "./db/connectDB.js";

import authRoutes from "./routes/auth.route.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const __dirname = path.resolve();

app.use(cors({ origin: "http://localhost:5173", credentials: true}));

app.use(express.json()); //To allow parse incoming requests with JSON payLoads
app.use(cookieParser()); //It allow us to perse incoming cookies

app.use("/api/auth", authRoutes);

if(process.env.NODE_ENV === "production"){
    app.use(express.static(path.join(__dirname, "/frontend/dist")));

    app.get("*", (req, res) => {
        res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
    });
}
app.listen(PORT, () => {
    connectDB();
    console.log("Server is running on port: ", PORT);
});