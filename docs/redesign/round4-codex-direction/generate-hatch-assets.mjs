// Hatch character asset generation via gpt-image-1 (founder directive: all Hatch
// assets are real generated images; no SVG Hatch anywhere).
// Run from repo root: node docs/redesign/round4-codex-direction/generate-hatch-assets.mjs [pose ...]
// Reads OPENAI_API_KEY from .env.local. Outputs transparent PNGs to public/hatch/v2/.
import { mkdir, readFile, writeFile, stat } from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const envPath = path.join(repoRoot, ".env.local");
const outputDir = path.join(repoRoot, "public/hatch/v2");
const minBytes = 60 * 1024;

// The character bible — identical prefix on every pose keeps the character consistent.
const CHARACTER = `Hatch, a friendly small robot mascot for a serious learning platform. EXACT character, identical in every image: compact rounded glossy white-cream body like a smooth pebble, large rounded head, dark charcoal-green face screen with two big glowing mint-green oval eyes and a simple glowing mint smile, wearing a dark forest-green graduation mortarboard cap with a small gold tassel on its right, two small rounded stubby arms, no legs (gently hovering), soft studio lighting, subtle warm reflections. High-quality 3D render, Pixar-adjacent but restrained, matte-glossy mix. Pure transparent background, no floor shadow beyond a very soft contact hint, no text, no props except those specified.`;

const POSES = [
  { name: "wave",        prompt: "waving cheerfully with its right arm raised, head tilted slightly, warm welcoming expression" },
  { name: "idle",        prompt: "neutral friendly standing pose, arms relaxed at sides, gentle smile, calm" },
  { name: "listening",   prompt: "wearing small dark-green over-ear headphones over the cap, holding a tiny cream notepad and pencil, attentive eyes slightly widened" },
  { name: "reviewing",   prompt: "holding a magnifying glass up to one enlarged eye, focused scanning expression, other arm behind back" },
  { name: "speaking",    prompt: "mid-speech gesture with one arm raised making a point, mouth open in a talking smile, energetic" },
  { name: "celebrating", prompt: "both arms thrown up in celebration, cap tossed slightly off the head mid-air, confetti pieces in forest-green, gold, and mint floating around, big joyful smile" },
  { name: "thinking",    prompt: "one arm bent with hand under chin in a thinking pose, eyes looking up-left, a small glowing mint thought bubble above" },
  { name: "reading",     prompt: "holding an open cream-colored book with both arms, eyes looking down at the pages, absorbed" },
  { name: "writing",     prompt: "writing with an oversized pencil on a floating cream card, tongue-out concentration in the eyes" },
  { name: "presenting",  prompt: "gesturing with one arm toward a small floating bar chart with forest-green and gold bars, confident presenter pose" },
  { name: "pointing",    prompt: "pointing to the right with its right arm fully extended, encouraging expression, guiding the viewer's eye" },
  { name: "avatar",      prompt: "head and shoulders only, centered, direct friendly eye contact, perfect for a small circular avatar crop" },
];

async function readApiKey() {
  const env = await readFile(envPath, "utf8");
  const line = env.split(/\r?\n/).find(l => l.startsWith("OPENAI_API_KEY="));
  if (!line) throw new Error("OPENAI_API_KEY not found in .env.local");
  return line.slice("OPENAI_API_KEY=".length).trim().replace(/^["']|["']$/g, "");
}

async function fileOk(p) {
  try { const s = await stat(p); return s.size >= minBytes; } catch { return false; }
}

async function generate(apiKey, pose) {
  const dest = path.join(outputDir, `${pose.name}.png`);
  if (await fileOk(dest)) { console.log(`SKIP (exists): ${pose.name}`); return true; }
  const body = {
    model: "gpt-image-1",
    prompt: `${CHARACTER}\n\nPOSE: ${pose.prompt}`,
    size: "1024x1024",
    quality: "high",
    background: "transparent",
    n: 1,
  };
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
      const json = await res.json();
      const b64 = json.data?.[0]?.b64_json;
      if (!b64) throw new Error("no b64 in response");
      const buf = Buffer.from(b64, "base64");
      if (buf.length < minBytes) throw new Error(`too small: ${buf.length}b`);
      await writeFile(dest, buf);
      console.log(`OK: ${pose.name} (${Math.round(buf.length / 1024)}KB)`);
      return true;
    } catch (e) {
      console.log(`RETRY ${attempt} ${pose.name}: ${e.message}`);
      await new Promise(r => setTimeout(r, 4000 * attempt));
    }
  }
  console.log(`FAILED: ${pose.name}`);
  return false;
}

const wanted = process.argv.slice(2);
const poses = wanted.length ? POSES.filter(p => wanted.includes(p.name)) : POSES;
await mkdir(outputDir, { recursive: true });
const key = await readApiKey();
let ok = 0;
for (const pose of poses) { if (await generate(key, pose)) ok++; }
console.log(`DONE: ${ok}/${poses.length}`);
