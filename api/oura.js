export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const token = process.env.OURA_ACCESS_TOKEN || process.env.OURA_TOKEN;
  if (!token) return res.status(401).json({ error: "No token" });

  const { action, start_date, end_date } = req.query;

  if (action === "login") {
    const url = "https://cloud.ouraring.com/oauth/authorize?response_type=code&client_id=" + process.env.OURA_CLIENT_ID + "&redirect_uri=" + encodeURIComponent(process.env.OURA_REDIRECT_URI) + "&scope=daily+personal";
    return res.redirect(url);
  }

  const url = start_date
    ? "https://api.ouraring.com/v2/usercollection/daily_activity?start_date=" + start_date + "&end_date=" + end_date
    : "https://api.ouraring.com/v2/usercollection/personal_info";

  try {
    const r = await fetch(url, { headers: { Authorization: "Bearer " + token } });
    const data = await r.json();
    return res.status(r.status).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
