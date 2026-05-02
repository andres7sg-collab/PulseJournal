// api/db.js — Supabase REST API proxy for Pulso Journal

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

async function supabase(method, table, body, params) {
  var url = SUPABASE_URL + "/rest/v1/" + table;
  if (params) url += "?" + params;
  var res = await fetch(url, {
    method: method,
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_KEY,
      "Authorization": "Bearer " + SUPABASE_KEY,
      "Prefer": method === "POST" ? "resolution=merge-duplicates,return=representation" : "return=representation"
    },
    body: body ? JSON.stringify(body) : undefined
  });
  var data = await res.json();
  return { ok: res.ok, status: res.status, data: data };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: "Supabase not configured" });
  }

  // GET /api/db — load all days and weights
  if (req.method === "GET") {
    try {
      var [daysRes, weightsRes] = await Promise.all([
        supabase("GET", "pulso_days", null, "user_id=eq.andres&order=date.asc"),
        supabase("GET", "pulso_weights", null, "user_id=eq.andres&order=date.asc")
      ]);
      return res.status(200).json({
        days: daysRes.ok ? daysRes.data : [],
        weights: weightsRes.ok ? weightsRes.data : []
      });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // POST /api/db — upsert days and/or weights
  if (req.method === "POST") {
    var body = req.body;
    try {
      var results = {};
      if (body.days && body.days.length > 0) {
        var daysToUpsert = body.days.map(function(d) {
          return { user_id: "andres", date: d.date, label: d.label, gym: d.gym || "", meals: d.meals || [], oura: d.oura || null };
        });
        var r = await supabase("POST", "pulso_days", daysToUpsert, null);
        results.days = r.ok ? "ok" : r.data;
      }
      if (body.weights && body.weights.length > 0) {
        var weightsToUpsert = body.weights.map(function(w) {
          return { user_id: "andres", date: w.date, kg: w.kg, note: w.note || "" };
        });
        var r2 = await supabase("POST", "pulso_weights", weightsToUpsert, null);
        results.weights = r2.ok ? "ok" : r2.data;
      }
      return res.status(200).json(results);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
