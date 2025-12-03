// api/generate.js - Works perfectly on Vercel serverless

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { prompt, model, width, height } = req.body || {};

    if (!prompt || !model || !width || !height) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const API_KEY = process.env.HF_API_KEY;
    if (!API_KEY)
      return res.status(500).json({ error: "HF_API_KEY not configured" });

    const hfRes = await fetch(
      `https://api-inference.huggingface.co/models/${model}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: { width, height },
          options: { wait_for_model: true },
        }),
      }
    );

    const contentType = hfRes.headers.get("content-type") || "";

    // Agar HF ne JSON bheja (error hota hai), toh JSON hi return karo
    if (contentType.includes("application/json")) {
      const json = await hfRes.json();
      if (!hfRes.ok) return res.status(400).json({ error: json });
      return res.status(200).json(json);
    }

    // Agar image binary aayi hai → base64 bana ke frontend ko bhejo
    const buffer = await hfRes.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    return res.status(200).json({ image_base64: base64 });
  } catch (err) {
    console.error("API Error:", err);
    return res.status(500).json({ error: err.message || String(err) });
  }
};
