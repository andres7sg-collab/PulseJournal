export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { action, start_date, end_date } = req.query;

  if (action === "login") {
    const loginUrl = "https://cloud.ouraring.com/oauth/authorize?response_type=code&client_id=" + process.env.OURA_CLIENT_ID + "&redirect_uri=" + encodeURIComponent(process.env.OURA_REDIRECT_URI) + "&scope=daily+personal+workout+session";
    return res.redirect(loginUrl);
  }

  if (!start_date || !end_date) {
    return res.status(400).json({ error: "start_date and end_date required" });
  }

  const base = "https://api.ouraring.com/v2/usercollection/";

  let refreshDebug = null;

  async function refreshToken() {
    const refreshTokenVal = process.env.OURA_REFRESH_TOKEN;
    if (!refreshTokenVal) {
      refreshDebug = { step: "no_refresh_token_env" };
      return null;
    }

    const clientId = process.env.OURA_CLIENT_ID;
    const clientSecret = process.env.OURA_CLIENT_SECRET;
    const attempts = [];

    // Attempt 1: Basic auth header
    try {
      const basic = Buffer.from(clientId + ":" + clientSecret).toString("base64");
      const r1 = await fetch("https://api.ouraring.com/oauth/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": "Basic " + basic,
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: refreshTokenVal,
        }),
      });
      const d1 = await r1.json();
      attempts.push({ method: "basic_auth", status: r1.status, body: d1 });
      if (d1.access_token) {
        refreshDebug = { attempts: attempts, success: "basic_auth" };
        return { access_token: d1.access_token, refresh_token: d1.refresh_token };
      }
    } catch (e) {
      attempts.push({ method: "basic_auth", exception: e.message });
    }

    // Attempt 2: credentials in body with redirect_uri
    try {
      const r2 = await fetch("https://api.ouraring.com/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: refreshTokenVal,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: process.env.OURA_REDIRECT_URI || "",
        }),
      });
      const d2 = await r2.json();
      attempts.push({ method: "body_with_redirect", status: r2.status, body: d2 });
      if (d2.access_token) {
        refreshDebug = { attempts: attempts, success: "body_with_redirect" };
        return { access_token: d2.access_token, refresh_token: d2.refresh_token };
      }
    } catch (e) {
      attempts.push({ method: "body_with_redirect", exception: e.message });
    }

    refreshDebug = { attempts: attempts, refresh_prefix: refreshTokenVal.substring(0, 12) + "..." };
    return null;
  }

  async function fetchAll(token) {
    const headers = { Authorization: "Bearer " + token };
    const [actRes, sleepRes, workoutRes] = await Promise.all([
      fetch(base + "daily_activity?start_date=" + start_date + "&end_date=" + end_date, { headers }),
      fetch(base + "daily_sleep?start_date=" + start_date + "&end_date=" + end_date, { headers }),
      fetch(base + "workout?start_date=" + start_date + "&end_date=" + end_date, { headers }),
    ]);
    return { actRes, sleepRes, workoutRes };
  }

  try {
    let token = process.env.OURA_ACCESS_TOKEN || process.env.OURA_TOKEN;
    if (!token) return res.status(401).json({ error: "No token" });

    let { actRes, sleepRes, workoutRes } = await fetchAll(token);

    let newTokenInfo = null;
    if (actRes.status === 401 || sleepRes.status === 401 || workoutRes.status === 401) {
      const refreshed = await refreshToken();
      if (refreshed) {
        newTokenInfo = refreshed;
        const retry = await fetchAll(refreshed.access_token);
        actRes = retry.actRes;
        sleepRes = retry.sleepRes;
        workoutRes = retry.workoutRes;
      } else {
        return res.status(401).json({ error: "Token expired and refresh failed. Re-authorize via /api/oura?action=login", refresh_debug: refreshDebug });
      }
    }

    const [actData, sleepData, workoutData] = await Promise.all([
      actRes.json(),
      sleepRes.json(),
      workoutRes.json(),
    ]);

    const result = {
      activity: actData.data && actData.data[0] ? actData.data[0] : null,
      sleep: sleepData.data && sleepData.data[0] ? sleepData.data[0] : null,
      workouts: workoutData.data || [],
    };

    if (newTokenInfo) {
      result._token_refreshed = true;
      result._new_access_token = newTokenInfo.access_token;
      result._new_refresh_token = newTokenInfo.refresh_token;
      result._note = "Token was refreshed automatically. Update OURA_ACCESS_TOKEN and OURA_REFRESH_TOKEN in Vercel with these new values for persistence.";
    }

    return res.status(200).json(result);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
