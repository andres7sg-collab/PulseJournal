export const config = { api: { bodyParser: true } };

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  var body = req.body;
  if (!body || !body.text) return res.status(400).json({ error: "No text provided" });

  var key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(500).json({ error: "No API key" });

  var prompt = "Eres un nutricionista experto. El usuario describe lo que comio. Devuelve SOLO un array JSON valido, sin texto extra, sin markdown, sin explicaciones.\n\nFormato exacto:\n[{\"name\":\"Nombre\",\"cals\":123,\"protein\":10,\"carbs\":15,\"fat\":5,\"time\":\"13:00\",\"note\":\"descripcion\"}]\n\nReglas:\n- Estima porciones normales si no se especifican\n- Un objeto por alimento\n- time: estima segun contexto (desayuno 08:00, almuerzo 14:00, cena 21:00, snack 17:00)\n- Todos los valores numericos son enteros\n\nEl usuario comio: " + body.text;

  try {
    var r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }]
      })
    });

    var data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: JSON.stringify(data.error) });

    var raw = data.content[0].text.trim();
    // Strip markdown if present
    raw = raw.replace(/```json/g, "").replace(/```/g, "").trim();
    var items = JSON.parse(raw);
    return res.status(200).json({ items: items });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
