export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const token = process.env.OURA_ACCESS_TOKEN || process.env.OURA_TOKEN;
  if (!token) return res.status(401).json({ error: "No token" });

  const { action, start_date, end_date } = req.query;

  if (action === "login") {
    const loginUrl = "https://cloud.ouraring.com/oauth/authorize?response_type=code&client_id=" + process.env.OURA_CLIENT_ID + "&redirect_uri=" + encodeURIComponent(process.env.OURA_REDIRECT_URI) + "&scope=daily+personal+workout+session";
    return res.redirect(loginUrl);
  }

  if (!start_date || !end_date) {
    return res.status(400).json({ error: "start_date and end_date required" });
  }

  const base = "https://api.ouraring.com/v2/usercollection/";
  const headers = { Authorization: "Bearer " + token };

  try {
    const [actRes, sleepRes, workoutRes] = await Promise.all([
      fetch(base + "daily_activity?start_date=" + start_date + "&end_date=" + end_date, { headers }),
      fetch(base + "daily_sleep?start_date=" + start_date + "&end_date=" + end_date, { headers }),
      fetch(base + "workout?start_date=" + start_date + "&end_date=" + end_date, { headers }),
    ]);

    const [actData, sleepData, workoutData] = await Promise.all([
      actRes.json(),
      sleepRes.json(),
      workoutRes.json(),
    ]);

    return res.status(200).json({
      activity: actData.data && actData.data[0] ? actData.data[0] : null,
      sleep: sleepData.data && sleepData.data[0] ? sleepData.data[0] : null,
      workouts: workoutData.data || [],
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
