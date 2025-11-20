const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const nunjucks = require("nunjucks");
const db = require("./src/db");

const app = express();
app.use(bodyParser.json());
app.use(express.static("public"));

// Configure Nunjucks for rendering templates
nunjucks.configure({ autoescape: true });

const PORT = process.env.PORT || 3000;

// ------------------------
// API Routes
// ------------------------

// Add item to MongoDB
app.post("/api/add", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });

    const collection = db.get().collection("items");
    await collection.insertOne({ text, addedAt: new Date() });

    res.json({ status: "OK" });
  } catch (err) {
    console.error("Insert failed:", err);
    res.status(500).json({ error: "Insert failed" });
  }
});

// List items from MongoDB
app.get("/api/list", async (req, res) => {
  try {
    const collection = db.get().collection("items");
    const items = await collection.find({}).toArray();
    res.json(items);
  } catch (err) {
    console.error("Read failed:", err);
    res.status(500).json({ error: "Read failed" });
  }
});

// Get pod name
app.get("/api/podname", (req, res) => {
  res.json({ podName: process.env.POD_NAME || "unknown" });
});

// Download wiz-exercise.txt
app.get("/download/wiz-exercise", (req, res) => {
  const filePath = path.join(__dirname, "public", "wiz-exercise.txt");
  res.download(filePath, "wiz-exercise.txt", (err) => {
    if (err) {
      console.error("Error downloading file:", err);
      res.status(500).send("File not found");
    }
  });
});

// ------------------------
// UI Routes
// ------------------------

// Serve main index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Custom 404 page route
app.get("/page", (req, res) => {
  const errorMessage = `<h2> Unable to find ${req.query.name} </h2>`;
  const rendered = nunjucks.renderString(errorMessage);
  res.status(404).send(rendered);
});

// ------------------------
// Start server after DB is ready
// ------------------------
db.connect((err) => {
  if (err) {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
  }
  console.log("Connected to MongoDB!");
  app.listen(PORT, () => console.log(`App running at http://localhost:${PORT}`));
});
