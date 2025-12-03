// api/generate.js (Vercel or render.com serverless backend)

import fetch from "node-fetch";

export default async function handler(req, res) {
  try {
    const { prompt, model, width, height } = req.body;

    // Your REAL HuggingFace API key (safe here)
    const API_KEY = process.env.HF_API_KEY;

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

    const contentType = hfRes.headers.get("content-type");

    if (contentType.includes("application/json")) {
      const json = await hfRes.json();
      return res.status(200).json(json);
    }

    const blob = await hfRes.arrayBuffer();
    const base64 = Buffer.from(blob).toString("base64");

    res.status(200).json({
      image_base64: base64,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.toString() });
  }
}
