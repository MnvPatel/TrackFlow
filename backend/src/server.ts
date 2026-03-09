require("dotenv").config();
import { app } from "./app";
import {v2 as cloudinary} from 'cloudinary';
import { connectRedis } from "./config/redis";

connectRedis();

//cloudinary config
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_SECRET_KEY,
})

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("\n========== TaskManagingPortal BACKEND ==========");
  console.log(`Server listening on http://localhost:${PORT}`);
});