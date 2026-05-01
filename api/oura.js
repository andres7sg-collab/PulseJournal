export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const token = process.env.OURA_TOKEN;
  if (!token) return res.status(500).json({ error: "OURA_TOKEN not configured" });

  const { start_date, end_date, endpoint = "daily_activity" } = req.query;

  const url = endpoint === "personal_info"
    ? "https://api.ouraring.com/v2/usercollection/personal_info"
    : `https://api.ouraring.com/v2/usercollection/${endpoint}?start_date=${start_date}&end_date=${end_date}`;

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
