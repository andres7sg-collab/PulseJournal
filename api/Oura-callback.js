// api/oura-callback.js — Handles OAuth2 callback from Oura
// Exchanges the authorization code for an access token
// IMPORTANT: After getting the token, add it manually to Vercel env vars as OURA_ACCESS_TOKEN

const CLIENT_ID = process.env.OURA_CLIENT_ID;
const CLIENT_SECRET = process.env.OURA_CLIENT_SECRET;
const REDIRECT_URI = process.env.OURA_REDIRECT_URI || "https://pulse-journal-omega.vercel.app/api/oura-callback";

export default async function handler(req, res) {
  const { code, error } = req.query;

  if (error) {
    return res.status(400).send(`<h2>Error de autorización: ${error}</h2>`);
  }

  if (!code) {
    return res.status(400).send("<h2>No se recibió código de autorización</h2>");
  }

  try {
    const tokenRes = await fetch("https://api.ouraring.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      return res.status(400).send(`<h2>Error obteniendo token</h2><pre>${JSON.stringify(tokenData, null, 2)}</pre>`);
    }

    // Show token so user can add it to Vercel env vars
    return res.status(200).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Pulso Journal — Oura Conectado</title>
        <style>
          body { font-family: monospace; background: #080b0f; color: #c8d8e8; padding: 40px; max-width: 600px; margin: 0 auto; }
          h1 { color: #34d399; }
          .token { background: #0c1117; border: 1px solid #38bdf8; border-radius: 8px; padding: 16px; word-break: break-all; color: #38bdf8; margin: 20px 0; }
          .steps { background: #0c1117; border-radius: 8px; padding: 16px; margin: 20px 0; line-height: 1.8; }
          .step { color: #fbbf24; }
        </style>
      </head>
      <body>
        <h1>✅ Oura autorizado correctamente</h1>
        <p>Copia este access token y añádelo a Vercel como variable de entorno:</p>
        <div class="token"><strong>OURA_ACCESS_TOKEN</strong><br/><br/>${tokenData.access_token}</div>
        <div class="steps">
          <div class="step">Pasos:</div>
          1. Ve a <strong>vercel.com</strong> → tu proyecto → Settings → Environment Variables<br/>
          2. Añade: <strong>OURA_ACCESS_TOKEN</strong> = el token de arriba<br/>
          3. Haz <strong>Redeploy</strong><br/>
          4. Vuelve a Pulso Journal y toca <strong>Sync</strong> en cualquier día
        </div>
        <p style="color:#2a4050; font-size:12px;">Token de refresco (guárdalo también por si caduca): ${tokenData.refresh_token || "no disponible"}</p>
      </body>
      </html>
    `);
  } catch (err) {
    return res.status(500).send(`<h2>Error: ${err.message}</h2>`);
  }
}
