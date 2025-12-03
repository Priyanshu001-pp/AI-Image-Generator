// api/generate.js (Vercel serverless — NO node-fetch needed)

export default async function handler(req, res) {
  try {
    const { prompt, model, width, height } = req.body || {};
    const API_KEY = process.env.HF_API_KEY;

    if (!API_KEY) {
      return res.status(500).json({ error: "HF_API_KEY is missing in Vercel env" });
    }

    const hfRes = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
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
    });

    const contentType = hfRes.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const json = await hfRes.json();
      return res.status(200).json(json);
    }

    const buffer = await hfRes.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    res.status(200).json({
      image_base64: base64,
    });
  } catch (err) {
    console.error("Backend Error:", err);
    res.status(500).json({ error: err.toString() });
  }
}
