const express = require("express");
const axios = require("axios");
const cors = require("cors");
const Redis = require("redis");

const redisClient = Redis.createClient();

redisClient.on("error", (err) => {
  console.error("Redis error:", err);
});

redisClient.on("connect", () => {
  console.log("Connected to Redis");
});

(async () => {
  await redisClient.connect();
})().catch(console.error);

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const DEFAULT_EXPIRATION = 36000;

app.get("/photos", async (req, res) => {
  console.log("entered photos route");
  const albumId = req.query.albumId;
  try {
    const photos = await redisClient.get("photos");
    if (photos != null) {
      console.log("Cache Hit!");
      return res.json(JSON.parse(photos));
    } else {
      console.log("Cache Miss!");
      const { data } = await axios.get(
        "https://jsonplaceholder.typicode.com/photos",
        { params: { albumId } }
      );
      await redisClient.setEx(
        "photos",
        DEFAULT_EXPIRATION,
        JSON.stringify(data)
      );
      res.json(data);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/photos/:id", async (req, res) => {
  try {
    const { data } = await axios.get(
      `https://jsonplaceholder.typicode.com/photos/${req.params.id}`
    );
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(5000, () => {
  console.log("Server started on port 5000");
});
