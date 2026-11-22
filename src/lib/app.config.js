// Headshot Studio — what the visitor sees and which AI SKILLS model runs.
// Model: nano-banana-2-1-edit (photo edit that keeps the person's appearance, up to 14 input photos).

export const STYLES = [
  { id: "linkedin", tone: "#3b82f6", label: { en: "LinkedIn", ru: "LinkedIn" },
    prompt: "a polished LinkedIn profile headshot: navy blazer over a light shirt, soft neutral gray studio backdrop, soft key light, friendly confident smile" },
  { id: "corporate", tone: "#64748b", label: { en: "Corporate", ru: "Корпоративный" },
    prompt: "a corporate executive portrait: dark tailored suit, modern glass office softly blurred behind, crisp studio lighting" },
  { id: "founder", tone: "#22c55e", label: { en: "Startup founder", ru: "Основатель стартапа" },
    prompt: "a startup founder portrait: smart-casual knit sweater, bright modern loft office with plants softly blurred, natural window light" },
  { id: "creative", tone: "#f97316", label: { en: "Creative", ru: "Креативный" },
    prompt: "a creative professional portrait: stylish dark turtleneck, warm colored backdrop, soft rim light, editorial magazine look" },
  { id: "doctor", tone: "#06b6d4", label: { en: "Doctor", ru: "Врач" },
    prompt: "a medical professional headshot: white doctor's coat over light blue scrubs, clean bright clinic background softly blurred" },
  { id: "lawyer", tone: "#a16207", label: { en: "Lawyer", ru: "Юрист" },
    prompt: "a lawyer portrait: charcoal suit, wood-paneled office with law books softly blurred, classic warm lighting" },
  { id: "realtor", tone: "#eab308", label: { en: "Realtor", ru: "Риелтор" },
    prompt: "a real estate agent headshot: smart blazer, bright modern living room softly blurred, warm welcoming smile" },
  { id: "outdoor", tone: "#84cc16", label: { en: "Outdoor", ru: "На улице" },
    prompt: "an outdoor natural-light portrait: smart casual outfit, city park with golden hour light and soft bokeh" },
  { id: "studio-bw", tone: "#e5e7eb", label: { en: "Black & white", ru: "Чёрно-белый" },
    prompt: "a timeless black-and-white studio portrait: dark backdrop, dramatic Rembrandt lighting, fine film grain" },
  { id: "dating", tone: "#ec4899", label: { en: "Dating profile", ru: "Для знакомств" },
    prompt: "a relaxed dating profile photo: casual stylish outfit, cozy cafe with warm lights softly blurred, natural candid smile" },
  { id: "id-photo", tone: "#f8fafc", label: { en: "ID photo", ru: "Фото на документы" },
    prompt: "a passport-style ID photo: plain white background, neutral expression, even front lighting, head and shoulders centered, no accessories" },
  { id: "speaker", tone: "#8b5cf6", label: { en: "Conference speaker", ru: "Спикер" },
    prompt: "a conference speaker portrait: smart blazer, stage with soft blue lights and bokeh behind, confident look" },
];

export const ASPECTS = ["1:1", "4:5", "3:4", "16:9", "9:16"];
export const RESOLUTIONS = ["1k", "2k"];
export const MODEL = "nano-banana-2-1-edit";

export const APP = {
  id: "headshot-studio",
  name: "Headshot Studio",
  theme: "slate-indigo",
  tagline: { en: "Professional AI headshots", ru: "Профессиональные портреты с ИИ" },
  kicker: { en: "AI headshots in minutes", ru: "Портрет с ИИ за минуты" },
  headline: { en: "Studio-quality headshots from a selfie", ru: "Студийный портрет из обычного селфи" },
  description: {
    en: "Add 1–4 clear photos of your face, pick a style — get a professional portrait for LinkedIn, your website or documents.",
    ru: "Добавьте 1–4 чётких фото лица, выберите стиль — и получите профессиональный портрет для LinkedIn, сайта или документов.",
  },
  cta: { en: "Generate headshot", ru: "Создать портрет" },
  models: [MODEL],
  upload: { types: ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"], maxBytes: 20 * 1024 * 1024 },
  slots: [{
    key: "images", kind: "image", min: 1, max: 4,
    label: { en: "Your photos", ru: "Ваши фото" },
    hint: { en: "Face clearly visible, good light, no sunglasses. More photos = better likeness.", ru: "Лицо хорошо видно, свет ровный, без тёмных очков. Чем больше фото, тем точнее сходство." },
  }],
  counts: [1, 2, 4],
  compare: false,
  initialState: () => ({ style: STYLES[0].id, aspect: "1:1", resolution: "1k", count: 1, note: "" }),
  priceModel: () => MODEL,
  label: (s, tx) => tx(STYLES.find((x) => x.id === s.style)?.label) || "",
};
