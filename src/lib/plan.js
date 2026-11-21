import "server-only";
import { STYLES, ASPECTS, RESOLUTIONS, MODEL } from "@/lib/app.config";
import { pick, urls, text } from "@/lib/plan-helpers";

// Request of the visitor → list of AI SKILLS generations (one per variant).
export function plan(body) {
  const images = urls(body.inputs, "images", { min: 1, max: 4, name: "photo of your face" });
  const style = STYLES.find((s) => s.id === body.style) || STYLES[0];
  const note = text(body.note, 200);
  const count = pick(Number(body.count), [1, 2, 4], 1);
  const prompt =
    `Create a photorealistic professional headshot of the same person shown in the reference photo${images.length > 1 ? "s" : ""}: ${style.prompt}. ` +
    "Keep the exact face, identity, age, skin tone, hairstyle and eye color; natural skin texture, no beauty filter, realistic hands and clothing, sharp focus on the eyes, head and shoulders framing." +
    (note ? ` Extra wishes: ${note}.` : "");
  const job = {
    model: MODEL,
    prompt,
    params: { aspect_ratio: pick(body.aspect, ASPECTS, "1:1"), resolution: pick(body.resolution, RESOLUTIONS, "1k") },
    inputs: { image_urls: images },
  };
  return Array.from({ length: count }, () => job);
}
