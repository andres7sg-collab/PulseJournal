// api/oura.js — Oura OAuth2 proxy for Pulso Journal

const CLIENT_ID = process.env.OURA_CLIENT_ID;
const CLIENT_SECRET = process.env.OURA_CLIENT_SECRET;
const REDIRECT_URI = process.env.OURA_REDIRECT_URI || "https://pulse-journal-omega.vercel.app/api/oura-callback";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { action, start_date, end_date } = req.query;

  // 1. Redirect to Oura OAuth2 login
  if (action === "login") {
    const url = `https://cloud.ouraring.com/oauth/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=daily+personal`;
    return res.redirect(url);
  }

  // 2. Fetch activity data with stored token
  const token = process.env.OURA_ACCESS_TOKEN;
  if (!token) {
    return res.status(401).json({ error: "No access token. Visit /api/oura?action=login to authorize." });
  }

  const url = start_date
    ? `https://api.ouraring.com/v2/usercollection/daily_activity?start_date=${start_date}&end_date=${end_date}`
    : "https://api.ouraring.com/v2/usercollection/personal_info";

  try {
    const ouraRes = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await ouraRes.json();
    return res.status(ouraRes.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
