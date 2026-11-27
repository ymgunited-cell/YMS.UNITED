import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { requireUserId } from "./require-user";
import { ensureZeroCostAiAllowed } from "../../lib/zero-cost-ai";

const router = Router();

// Step 1: Describe the image with vision, Step 2: Generate anime version
router.post("/anime", async (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  if (!ensureZeroCostAiAllowed(res)) return;

  try {
    const { imageBase64, mimeType } = req.body as {
      imageBase64: string;
      mimeType?: string;
    };
    if (!imageBase64) {
      res.status(400).json({ error: "imageBase64 required" });
      return;
    }

    const mime = mimeType || "image/jpeg";
    const dataUrl = `data:${mime};base64,${imageBase64}`;

    // Step 1: Describe the image
    const vision = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: dataUrl, detail: "high" },
            },
            {
              type: "text",
              text: "Describe this image in extremely detailed visual terms: the subjects, their appearance, clothing, poses, expressions, hair, skin tone, colors, background/setting, lighting, and mood. Be very specific and detailed so an artist can recreate it.",
            },
          ],
        },
      ],
      max_tokens: 500,
    });

    const description = vision.choices[0]?.message?.content || "a person";

    // Step 2: Generate anime version
    const animePrompt = `High-quality anime illustration in the style of Studio Ghibli / modern anime. ${description}. Anime art style with: clean outlines, vibrant saturated colors, expressive anime eyes, smooth cel-shading, beautiful detailed background. High resolution, masterpiece quality.`;

    const imageResponse = await openai.images.generate({
      model: "gpt-image-1",
      prompt: animePrompt,
      n: 1,
      size: "1024x1024",
      quality: "high",
    });

    const b64 = imageResponse.data?.[0]?.b64_json;
    if (!b64) {
      res.status(500).json({ error: "No image generated" });
      return;
    }

    res.json({ url: `data:image/png;base64,${b64}`, description });
  } catch (err) {
    req.log.error({ err }, "Failed to generate anime image");
    res.status(500).json({ error: "Failed to generate anime image" });
  }
});

export default router;
