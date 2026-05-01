export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "No text provided" });

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(500).json({ error: "No API key" });

  const prompt = `Eres un nutricionista experto. El usuario describe lo que comió. Devuelve SOLO un array JSON válido con los alimentos, sin texto extra, sin markdown, sin explicaciones.

Formato exacto:
[{"name":"Nombre del alimento","cals":123,"protein":10,"carbs":15,"fat":5,"time":"13:00","note":"descripción breve"}]

Reglas:
- Estima porciones normales si no se especifican
- Si hay varios alimentos, un objeto por alimento
- time: estima según contexto (desayuno ~08:00, almuerzo ~14:00, cena ~21:00, snack ~17:00)
- note: descripción breve de la estimación
- Todos los valores numéricos son enteros

El usuario comió: ${text}`;

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
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

    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data.error || "API error" });

    const text2 = data.content[0].text.trim();
    const items = JSON.parse(text2);
    return res.status(200).json({ items });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
