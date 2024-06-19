import dotenv from "dotenv";
import express from "express";
import { getConnection } from "./sqlDb.cjs";
import OpenAI from "openai";
import { config, uploader } from "cloudinary";
import cors from "cors";

dotenv.config();
const app = express();
const PORT = 9000;

//Configure openai
const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });
//Configure cloudinary
config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});
//Cors
const corsOptions = {
  origin: ["http://localhost:5173"],
};
//Middlewares
app.use(express.json());
app.use(cors(corsOptions));

// Function to insert image into MS-SQL database
async function insertImageIntoDatabase(imageCreated) {
  try {
    let pool = await getConnection();
    const request = pool.request();

    // Insert data into the Jauch_MemeMaster_3000 table
    await request.query(`INSERT INTO Jauch_MemeMaster_3000 (MemeName, Eingabe, PictureUrl, public_id, createdAt)
                             VALUES ('${imageCreated.prompt}', '', '${imageCreated.url}', '${imageCreated.public_id}',
                                     '${imageCreated.createdAt}')`);
  } catch (err) {
    console.error("Error while inserting data into the database:", err);
    throw err;
  }
}

//Route
app.post("/generate-image", async (req, res) => {
  const { prompt } = req.body;
  try {
    const imageResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1024",
    });
    //Save the image into cloudinary
    const image = await uploader.upload(imageResponse.data[0].url, {
      folder: "ai-art-work",
    });
    //Save into MS-SQL database
    const imageCreated = {
      Eingabe: imageResponse.data[0].revised_prompt,
      PictureUrl: imageResponse.data[0].url,
      public_id: image.public_id,
      createdAt: new Date(),
    };
    await insertImageIntoDatabase(imageCreated);
    res.json(imageCreated);
  } catch (error) {
    console.log(error);
    res.json({ message: "Error generating image" });
  }
});

// List images route

//!!!!ERROR CATCHING FOR IMAGES !!!! FROM SQL DATABASE, because the URL exceeds the 4000 character Limit
app.get("/images", async (req, res) => {
  try {
    let pool = await getConnection();
    const request = pool.request();

    // Query to retrieve images from Jauch_MemeMaster_3000 table
    const result = await request.query(`SELECT *
                                            FROM Jauch_MemeMaster_3000`);

    // Return the images as JSON with Cloudinary URLs
    const images = result.recordset.map((image) => ({
      id: image.id,
      url: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${image.public_id}`,
    }));

    res.json(images);
  } catch (error) {
    res.json({ message: "Error fetching images" });
  }
});

//Start the server
app.listen(PORT, console.log("Server is running..."));
