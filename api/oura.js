export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { action, start_date, end_date, endpoint = "daily_activity" } = req.query;

  // OAuth2 login redirect
  if (action === "login") {
    const CLIENT_ID = process.env.OURA_CLIENT_ID;
    const REDIRECT_URI = process.env.OURA_REDIRECT_URI;
    const url = `https://cloud.ouraring.com/oauth/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=daily+personal`;
    return res.redirect(url);
  }

  const token = process.env.OURA_ACCESS_TOKEN || process.env.OURA_TOKEN;
  if (!token) return res.status(401).json({ error: "No token configured" });

  // Build URL
  let url;
  if (endpoint === "personal_info") {
    url = "https://api.ouraring.com/v2/usercollection/personal_info";
  } else if (start_date && end_date) {
    url = `https://api.ouraring.com/v2/usercollection/${endpoint}?start_date=${start_date}&end_date=${end_date}`;
  } else {
    // No dates — fetch last 7 days
    const today = new Date().toISOString().split("T")[0];
    const week = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
    url = `https://api.ouraring.com/v2/usercollection/${endpoint}?start_date=${week}&end_date=${today}`;
  }

  try {
    const ouraRes = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await ouraRes.json();
    // Return full debug info so we can see what's happening
    return res.status(ouraRes.status).json({
      status: ouraRes.status,
      url_called: url,
      token_prefix: token.substring(0, 8) + "...",
      data
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
