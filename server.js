require("dotenv").config();
const express = require("express");
const path = require("path");
const loginHandler = require("./api/login");

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use("/assets", express.static(path.join(__dirname, "public", "assets")));

// Pages
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/secure", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "secure.html"));
});

// API — reuse the same Vercel handler
app.post("/api/login", (req, res) => {
  loginHandler(req, res);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
