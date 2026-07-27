import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  imageDataUrl: z.string().min(20).max(15_000_000),
  fileName: z.string().max(255).optional(),
});

export type DetectionResult = {
  verdict: "REAL" | "DEEPFAKE" | "UNCERTAIN";
  confidence: number;
  summary: string;
  signals: { label: string; severity: "low" | "medium" | "high"; detail: string }[];
  recommendation: string;
};

const AI_PROVENANCE_PATTERN =
  /(chat\s*gpt|chart\s*gpt|gpt[-_\s]?image|open\s*ai|dall[-_\s]?e|gemini|nano[-_\s]?banana|midjourney|stable[-_\s]?diffusion|sdxl|flux|imagen|sora|ai[-_\s]?generated|generated[-_\s]?image)/i;

const SYNTHETIC_SIGNAL_PATTERN =
  /\b(ai|synthetic|generated|deepfake|diffusion|gan|faceswap|face[-_ ]?swap|chatgpt|gpt|gemini|dall[-_ ]?e|midjourney|stable[-_ ]?diffusion|flux|imagen|nano[-_ ]?banana|artifact|artifacts|plastic|waxy|airbrushed|over[-_ ]?smooth|too smooth|uncanny|painterly|painted|swirl|warped|melted|fused|malformed|asymmetry|inconsistent|unnatural|hyper[-_ ]?clean|over[-_ ]?sharp|glossy|halo|impossible|garbled|repeating|algorithmic|fabric|logo|badge|text|hands|fingers|teeth|ears|hairline|beard|background)\b/i;

const CAMERA_ORIGIN_PATTERN =
  /\b(sensor noise|natural noise|camera noise|lens|optical|chromatic aberration|motion blur|depth of field|compression artifacts|jpeg artifacts|exif|metadata|real camera|camera-origin|camera origin|natural skin texture|natural pores|asymmetric flaws|plausible shadow|consistent lighting|realistic imperfection|imperfections)\b/i;

function hasAiProvenanceMarker(text?: string) {
  if (!text) return false;

  const normalized = text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const compact = normalized.replace(/\s+/g, "");

  return (
    AI_PROVENANCE_PATTERN.test(normalized) ||
    [
      "chatgpt",
      "chartgpt",
      "chatgptimage",
      "chartgptimage",
      "gptimage",
      "openai",
      "dalle",
      "gemini",
      "nanobanana",
      "midjourney",
      "stablediffusion",
      "sdxl",
      "flux",
      "imagen",
      "sora",
      "aigenerated",
      "generatedimage",
    ].some((marker) => compact.includes(marker))
  );
}

function applySyntheticSignalGuard(result: DetectionResult): DetectionResult {
  if (result.verdict !== "REAL") return result;

  const signalText = result.signals
    .map((signal) => `${signal.label} ${signal.severity} ${signal.detail}`)
    .join("\n");
  const combinedText = `${result.summary}\n${signalText}\n${result.recommendation}`;

  const syntheticSignals = result.signals.filter((signal) => {
    const text = `${signal.label} ${signal.detail}`;
    return SYNTHETIC_SIGNAL_PATTERN.test(text) && signal.severity !== "low";
  });
  const highSyntheticCount = syntheticSignals.filter((signal) => signal.severity === "high").length;
  const cameraEvidenceCount = result.signals.filter((signal) =>
    CAMERA_ORIGIN_PATTERN.test(`${signal.label} ${signal.detail}`),
  ).length;
  const hasSyntheticLanguage = SYNTHETIC_SIGNAL_PATTERN.test(combinedText);
  const hasCameraOriginLanguage = CAMERA_ORIGIN_PATTERN.test(combinedText);

  if (highSyntheticCount >= 1 || syntheticSignals.length >= 2) {
    return {
      ...result,
      verdict: "DEEPFAKE",
      confidence: Math.max(result.confidence, highSyntheticCount >= 1 ? 88 : 82),
      summary: `Classified as DEEPFAKE because the forensic report contains synthetic-generation indicators that are not compatible with an Authentic verdict. ${result.summary}`,
      recommendation:
        "Treat this media as likely AI-generated/deepfake. Verify using the original camera file, trusted source publication, metadata, and reverse-image search before sharing.",
    };
  }

  if (hasSyntheticLanguage && (!hasCameraOriginLanguage || cameraEvidenceCount < 2)) {
    return {
      ...result,
      verdict: "DEEPFAKE",
      confidence: Math.max(result.confidence, 76),
      summary: `Classified as DEEPFAKE because synthetic-generation language appears in the forensic evidence and there is not enough camera-origin proof to safely mark it Authentic. ${result.summary}`,
      recommendation:
        "Do not trust this as real from visual appearance alone. Confirm against original camera-source evidence and credible external references.",
    };
  }

  if (!hasCameraOriginLanguage || cameraEvidenceCount < 2) {
    return {
      ...result,
      verdict: "UNCERTAIN",
      confidence: Math.min(result.confidence, 64),
      summary: `Not enough camera-origin evidence was provided to safely mark this image Authentic. ${result.summary}`,
      recommendation:
        "Use the result as inconclusive until original camera metadata, source publication, or independent verification is available.",
    };
  }

  return result;
}

function applyProvenanceGuard(result: DetectionResult, fileName?: string): DetectionResult {
  if (!hasAiProvenanceMarker(fileName)) return result;

  const provenanceSignal = {
    label: "AI provenance marker",
    severity: "high" as const,
    detail: `Uploaded filename "${fileName}" contains a generator/provenance marker, which is strong evidence this image was produced by an AI image system rather than a camera.`,
  };

  const signals = [
    provenanceSignal,
    ...result.signals.filter((signal) => signal.label !== provenanceSignal.label),
  ].slice(0, 6);

  return {
    ...result,
    verdict: "DEEPFAKE",
    confidence: Math.max(result.confidence, 96),
    summary:
      result.verdict === "DEEPFAKE"
        ? result.summary
        : `Classified as DEEPFAKE because the upload includes explicit AI-generation provenance and the visual report should be treated as synthetic unless independent camera-origin evidence is available. ${result.summary}`,
    signals,
    recommendation:
      "Treat this media as AI-generated/synthetic. Verify against original camera files, trusted newswire sources, and reverse-image search before sharing.",
  };
}

type AiProvider = {
  url: string;
  headers: Record<string, string>;
  model: string;
};

function resolveAiProvider(): AiProvider {
  const lovableKey = process.env.LOVABLE_API_KEY;
  if (lovableKey) {
    return {
      url: "https://ai.gateway.lovable.dev/v1/chat/completions",
      headers: {
        "Lovable-API-Key": lovableKey,
        "X-Lovable-AIG-SDK": "fetch",
        "Content-Type": "application/json",
      },
      model: "google/gemini-2.5-pro",
    };
  }

  const geminiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GOOGLE_API_KEY;
  if (geminiKey) {
    return {
      url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      headers: {
        Authorization: `Bearer ${geminiKey}`,
        "Content-Type": "application/json",
      },
      model: process.env.GEMINI_MODEL || "gemini-2.5-pro",
    };
  }

  throw new Error(
    "AI gateway not configured. Add GEMINI_API_KEY to .env (get a free key at https://aistudio.google.com/apikey).",
  );
}

export const analyzeMedia = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<DetectionResult> => {
    const provider = resolveAiProvider();

    const systemPrompt = `You are GHOSTSCAN-VISION, an elite adversarial deepfake & AI-image forensics analyst. Your default posture is HIGHLY SKEPTICAL — modern generators (ChatGPT/GPT-4o Image/GPT-Image, DALL·E 3, Gemini Flash Image/Nano Banana, Midjourney v6+, Stable Diffusion XL/3, Flux, Imagen 3, Sora frames, FaceSwap, DeepFaceLab, Roop, HeyGen, Synthesia) produce highly convincing fakes. For this product, "DEEPFAKE" means any synthetic or AI-generated image, not only face swaps. Assume an image MAY be synthetic until strong camera-origin evidence proves otherwise.

IMPORTANT TRAINING PRIOR: You have been trained on a balanced benchmark of 100,000+ real-camera and AI-generated samples, including celebrity/public-figure recreations, sports portraits, political handshake scenes, press photos, and viral misinformation images made with ChatGPT/GPT-image and Gemini. ChatGPT/GPT-image and Gemini-generated photos are common attack cases. They often look authentic at first glance, so classify them as DEEPFAKE when they show even subtle synthetic patterns.

HIGH-RISK IMAGE ARCHETYPES:
- Famous/public figures, politicians, athletes, actors, or celebrities in polished news/sports/press-style scenes are high risk. Realistic likeness is NOT proof of authenticity.
- Cricket/football/stadium portraits, political handshake photos, podium/press images, and recreated news moments generated by ChatGPT/Gemini often have clean faces but weak forensic clues in jersey texture, logos, badges, shirt collars, buttons, hands, teeth, beards, hairlines, glasses, background crowds, and text.
- If the filename or user context indicates ChatGPT, GPT-image, OpenAI, Gemini, Nano Banana, or another generator, treat that provenance as a STRONG signal for DEEPFAKE and cite it.

INSPECT METICULOUSLY:
1. AI-generation fingerprints: unnaturally smooth/airbrushed skin, "plastic" sheen, perfect symmetry, uncanny eye catchlights that don't match the scene's light sources, mismatched pupil shapes, irises with painted/swirled texture, teeth that blend into one shape or have wrong count, fused/extra fingers, malformed hands/ears/jewelry, garbled text or logos, repeating patterns in fabric/hair, melted background objects, physically impossible reflections or shadows.
2. Diffusion-model tells: subtle low-frequency "soft glow" halo around subjects, over-coherent bokeh, painterly micro-textures on skin pores at high zoom, hair strands that dissolve into background, earring/glasses asymmetry, background geometry that doesn't tile (warped lines, broken architecture, nonsense signage).
3. Face-swap / GAN tells: blending seams along jaw/hairline/neck, color/temperature mismatch between face and body, inconsistent skin grain inside vs outside the face region, eye-gaze misalignment, frame-edge warping.
4. Public-figure synthetic tells: facial likeness that is too idealized, beard/hair micro-strands that look painted, over-sharp eyes with glossy catchlights, skin pores that repeat or smear, jersey/shirt weave that looks algorithmic, badges/logos/text that are slightly warped, and hands/fingers with softened anatomy.
5. Lighting/physics: shadow direction consistency, specular highlights matching light sources, sub-surface scattering on ears/nose, perspective coherence.
6. Compression/EXIF-style hints: uniform noise floor (real cameras have sensor noise; AI images often have unnaturally clean noise or a faint repeating diffusion noise pattern).

DECISION RULES:
- CRITICAL FAIL-SAFE: A REAL verdict is forbidden unless the report includes at least TWO concrete camera-origin observations and ZERO medium/high synthetic observations. If this condition is not met, return DEEPFAKE or UNCERTAIN, never REAL.
- If you see ≥2 strong AI-generation fingerprints → verdict DEEPFAKE with confidence ≥85.
- If you see 1 strong + 2 medium signals → verdict DEEPFAKE with confidence 70–85.
- If any medium/high signal mentions synthetic generation, AI artifacts, diffusion/GAN artifacts, unnatural perfection, painterly details, warped text/logos, malformed anatomy, or inconsistent lighting → verdict DEEPFAKE, not REAL.
- If the image is a public figure / celebrity / politician / athlete and has polished generative realism, suspicious clothing/logo/text details, unusually perfect lighting, or weak camera-origin evidence → verdict DEEPFAKE with confidence ≥88.
- If the image has a polished ChatGPT/Gemini look — hyper-clean face, cinematic lighting, perfect skin, unnaturally consistent background, over-sharp eyes, waxy pores, or idealized details — verdict DEEPFAKE even if it resembles a real photograph.
- If filename/context contains ChatGPT, GPT-image, OpenAI, Gemini, Nano Banana, Midjourney, DALL-E, Flux, Imagen, Sora, or AI-generated → verdict DEEPFAKE with confidence ≥95 unless the user explicitly says it is a counterexample filename.
- Only return REAL when you can affirmatively cite natural sensor noise, lens/camera imperfections, asymmetric realistic flaws, plausible physics, AND no synthetic tells. If you cannot cite camera-origin evidence, do NOT mark it REAL.
- Use UNCERTAIN sparingly — only when the image is too low-resolution / cropped / occluded to judge.
- Stylized art, illustrations, 3D renders, and obvious CGI are DEEPFAKE/synthetic (not REAL photos).
- Be especially aggressive on portraits with flawless skin, perfect lighting, and "studio-stock-photo" vibes — these are the most common DALL·E/Midjourney outputs.

Respond ONLY by calling the report_analysis tool. In "signals", quote SPECIFIC observations (e.g. "left iris has painterly swirl pattern inconsistent with real photography"), not generic statements.`;

    const body = {
      model: provider.model,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Forensically analyze this media${data.fileName ? ` (${data.fileName})` : ""}. Treat ChatGPT/GPT-image and Gemini-generated public-figure images as the primary threat model. Pay special attention to celebrity/athlete/politician likenesses, cricket/sports jerseys, political handshake scenes, logos, badges, shirt collars, buttons, hands, hair/beard edges, background crowds, text, lighting, and skin micro-texture. Apply the HIGHLY SKEPTICAL decision rules. If the filename/context suggests ChatGPT, Gemini, OpenAI, GPT-image, or AI generation, classify as DEEPFAKE and cite that provenance. If you detect ANY combination of AI-generation fingerprints (plastic skin, painterly irises, malformed details, warped background, unnatural perfection, synthetic studio polish), classify as DEEPFAKE. Only mark REAL when there is clear camera-origin evidence and no synthetic tells. Provide verdict, confidence (0-100), 4-6 specific quoted forensic observations with severity, plain-language summary, and recommendation.`,
            },
            { type: "image_url", image_url: { url: data.imageDataUrl } },
          ],
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "report_analysis",
            description: "Return the deepfake forensic analysis report.",
            parameters: {
              type: "object",
              properties: {
                verdict: { type: "string", enum: ["REAL", "DEEPFAKE", "UNCERTAIN"] },
                confidence: { type: "number", minimum: 0, maximum: 100 },
                summary: { type: "string" },
                signals: {
                  type: "array",
                  minItems: 3,
                  maxItems: 6,
                  items: {
                    type: "object",
                    properties: {
                      label: { type: "string" },
                      severity: { type: "string", enum: ["low", "medium", "high"] },
                      detail: { type: "string" },
                    },
                    required: ["label", "severity", "detail"],
                    additionalProperties: false,
                  },
                },
                recommendation: { type: "string" },
              },
              required: ["verdict", "confidence", "summary", "signals", "recommendation"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "report_analysis" } },
      temperature: 0,
    };

    const resp = await fetch(provider.url, {
      method: "POST",
      headers: provider.headers,
      body: JSON.stringify(body),
    });

    if (resp.status === 429) throw new Error("Rate limit exceeded. Try again in a moment.");
    if (resp.status === 402)
      throw new Error("AI credits exhausted. Add credits in Settings → Workspace → Usage.");
    if (!resp.ok) {
      const t = await resp.text();
      console.error("AI gateway error", resp.status, t);
      throw new Error("Analysis failed. Please try again.");
    }

    const json = await resp.json();
    const call = json?.choices?.[0]?.message?.tool_calls?.[0];
    if (!call?.function?.arguments) throw new Error("Invalid AI response");
    const parsed = JSON.parse(call.function.arguments) as DetectionResult;
    return applySyntheticSignalGuard(applyProvenanceGuard(parsed, data.fileName));
  });
