export default async function handler(req, res) {
  try {
    // CORS (important for browser)
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    // Only allow POST
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // Handle Vercel's non-parsed body
    let body = req.body;
    if (!body || typeof body !== "object") {
      try {
        body = JSON.parse(req.body);
      } catch (error) {
        return res.status(400).json({ error: "Invalid JSON body" });
      }
    }

    const { prompt, model, width, height } = body;

    if (!prompt || !model || !width || !height) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const API_KEY = process.env.HF_API_KEY;
    if (!API_KEY) {
      return res.status(500).json({ error: "HF_API_KEY not configured" });
    }

    // HuggingFace API call
    const hfRes = await fetch(
      `https://api-inference.huggingface.co/models/${model}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: { width, height },
          options: { wait_for_model: true }
        })
      }
    );

    const contentType = hfRes.headers.get("content-type") || "";

    // JSON response (error or info)
    if (contentType.includes("application/json")) {
      const json = await hfRes.json();
      return res.status(hfRes.status).json(json);
    }

    // Image response
    const buffer = Buffer.from(await hfRes.arrayBuffer());
    return res.status(200).json({ image_base64: buffer.toString("base64") });

  } catch (err) {
    console.error("Server Error:", err);
    return res.status(500).json({ error: err.message });
  }
}
