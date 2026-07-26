const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

async function getTokens() {
  const r = await fetch(SUPABASE_URL + "/rest/v1/oura_tokens?id=eq.andres&select=access_token,refresh_token", {
    headers: { apikey: SUPABASE_KEY, Authorization: "Bearer " + SUPABASE_KEY },
  });
  const rows = await r.json();
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

async function saveTokens(access, refresh) {
  await fetch(SUPABASE_URL + "/rest/v1/oura_tokens?id=eq.andres", {
    method: "PATCH",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: "Bearer " + SUPABASE_KEY,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ access_token: access, refresh_token: refresh, updated_at: new Date().toISOString() }),
  });
}

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
  let lastRefreshDebug = null;

  async function refreshToken(currentRefresh) {
    try {
      const r = await fetch("https://api.ouraring.com/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: currentRefresh,
          client_id: process.env.OURA_CLIENT_ID,
          client_secret: process.env.OURA_CLIENT_SECRET,
        }),
      });
      const data = await r.json();
      lastRefreshDebug = {
        oura_status: r.status,
        oura_body: data,
        refresh_used_prefix: (currentRefresh || "").substring(0, 12) + "...",
        redirect_uri: process.env.OURA_REDIRECT_URI,
      };
      if (data.access_token && data.refresh_token) {
        const saveRes = await fetch(SUPABASE_URL + "/rest/v1/oura_tokens?id=eq.andres", {
          method: "PATCH",
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: "Bearer " + SUPABASE_KEY,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify({ access_token: data.access_token, refresh_token: data.refresh_token, updated_at: new Date().toISOString() }),
        });
        lastRefreshDebug.supabase_save_status = saveRes.status;
        lastRefreshDebug.supabase_save_body = await saveRes.json();
        return data.access_token;
      }
      return null;
    } catch (e) {
      lastRefreshDebug = { exception: e.message };
      return null;
    }
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
    const tokens = await getTokens();
    if (!tokens) return res.status(500).json({ error: "No tokens in DB" });

    let token = tokens.access_token;
    let { actRes, sleepRes, workoutRes } = await fetchAll(token);

    if (actRes.status === 401 || sleepRes.status === 401 || workoutRes.status === 401) {
      const newAccess = await refreshToken(tokens.refresh_token);
      if (newAccess) {
        const retry = await fetchAll(newAccess);
        actRes = retry.actRes;
        sleepRes = retry.sleepRes;
        workoutRes = retry.workoutRes;
      } else {
        return res.status(401).json({ error: "Refresh failed. Re-authorize via /api/oura?action=login", debug: lastRefreshDebug });
      }
    }

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
