// api/oura.js — Vercel serverless function
// Proxies Oura API requests to avoid CORS issues
// Set OURA_TOKEN in Vercel environment variables (never hardcode it)

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const token = process.env.OURA_TOKEN;
  if (!token) return res.status(500).json({ error: "OURA_TOKEN not configured" });

  const { start_date, end_date } = req.query;
  if (!start_date || !end_date) {
    return res.status(400).json({ error: "start_date and end_date required" });
  }

  try {
    const ouraRes = await fetch(
      `https://api.ouraring.com/v2/usercollection/daily_activity?start_date=${start_date}&end_date=${end_date}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!ouraRes.ok) {
      return res.status(ouraRes.status).json({ error: `Oura API error: ${ouraRes.status}` });
    }

    const data = await ouraRes.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
