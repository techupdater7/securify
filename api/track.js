const { MongoClient } = require("mongodb");

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

  if (req.method !== "POST") return res.status(405).end();

  try {
    const db = await getDb();
    await db.collection("visits").insertOne({
      page: req.body.page || "unknown",
      timestamp: new Date().toISOString(),
      ip: req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || "unknown",
      userAgent: req.headers["user-agent"] || "unknown",
      referrer: req.headers["referer"] || "direct",
    });
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ ok: false });
  }
};
