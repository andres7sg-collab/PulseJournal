const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (!SUPABASE_URL || !SUPABASE_KEY) return res.status(500).json({ error: "Supabase not configured" });

  var headers = {
    "Content-Type": "application/json",
    "apikey": SUPABASE_KEY,
    "Authorization": "Bearer " + SUPABASE_KEY,
  };

  if (req.method === "GET") {
    try {
      var [dr, wr] = await Promise.all([
        fetch(SUPABASE_URL + "/rest/v1/pulso_days?user_id=eq.andres&order=date.asc", { headers: headers }),
        fetch(SUPABASE_URL + "/rest/v1/pulso_weights?user_id=eq.andres&order=date.asc", { headers: headers }),
      ]);
      var days = await dr.json();
      var weights = await wr.json();
      return res.status(200).json({ days: Array.isArray(days) ? days : [], weights: Array.isArray(weights) ? weights : [] });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (req.method === "POST") {
    var body = req.body;
    try {
      var results = {};

      if (body.days && body.days.length > 0) {
        var upsertHeaders = Object.assign({}, headers, { "Prefer": "resolution=merge-duplicates,return=minimal" });
        var daysPayload = body.days.map(function(d) {
          return { user_id: "andres", date: d.date, label: d.label || "", gym: d.gym || "", meals: d.meals || [], oura: d.oura || null };
        });
        var dr2 = await fetch(SUPABASE_URL + "/rest/v1/pulso_days", {
          method: "POST",
          headers: upsertHeaders,
          body: JSON.stringify(daysPayload)
        });
        results.days = dr2.ok ? "ok" : await dr2.text();
      }

      if (body.weights && body.weights.length > 0) {
        var upsertHeaders2 = Object.assign({}, headers, { "Prefer": "resolution=merge-duplicates,return=minimal" });
        var weightsPayload = body.weights.map(function(w) {
          return { user_id: "andres", date: w.date, kg: w.kg, note: w.note || "" };
        });
        var wr2 = await fetch(SUPABASE_URL + "/rest/v1/pulso_weights", {
          method: "POST",
          headers: upsertHeaders2,
          body: JSON.stringify(weightsPayload)
        });
        results.weights = wr2.ok ? "ok" : await wr2.text();
      }

      return res.status(200).json(results);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
