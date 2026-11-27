import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { requireUserId } from "./require-user";
import { ensureZeroCostAiAllowed } from "../../lib/zero-cost-ai";

const router = Router();

router.post("/generate-image", async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  if (!ensureZeroCostAiAllowed(res)) return;

  try {
    const { prompt } = req.body as { prompt: string };
    if (!prompt || !prompt.trim()) {
      res.status(400).json({ error: "prompt required" });
      return;
    }

    const enhancedPrompt = `${prompt.trim()}. Professional, high quality, highly detailed, sharp focus, masterpiece, best quality, cinematic lighting.`;

    const imageResponse = await openai.images.generate({
      model: "gpt-image-1",
      prompt: enhancedPrompt,
      n: 1,
      size: "1024x1024",
      quality: "high",
    });

    const b64 = imageResponse.data?.[0]?.b64_json;
    if (!b64) {
      res.status(500).json({ error: "No image generated" });
      return;
    }

    res.json({ url: `data:image/png;base64,${b64}` });
  } catch (err) {
    req.log.error({ err }, "Failed to generate image");
    res.status(500).json({ error: "Failed to generate image" });
  }
});

export default router;
