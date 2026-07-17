import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const envPath = "/Users/sandeep/Projects/myproductschool/.env.local";
const outputDir = path.join(repoRoot, "docs/redesign/images");
const minBytes = 100 * 1024;

const sharedPrompt =
  "Generate a high-fidelity UI concept image for a design review. Use only this shared palette across the whole image: warm cream #faf6f0, forest green #4a7c59, amber #c9933a, muted taupe, dark forest #1e3528. Do not add other colors. The four directions must be unmistakably visually distinct from each other: different screen, different layout skeleton, different composition, different crop.";

const concepts = [
  {
    label: "direction-a-precision-instrument",
    filename: "direction-a-precision-instrument.png",
    prompt: `${sharedPrompt}

Direction A: "Precision Instrument".
Subject: a data-dense analytics DASHBOARD, straight-on flat screenshot, full-bleed. Compact LEFT SIDEBAR navigation. The page is a grid of small precise low-radius 6px cards with thin taupe 1px borders and NO shadows: a GitHub-style green activity heatmap grid, several small progress rings, a radar/hexagon chart, tiny bar charts, and a dense data table of practice items with monospace numbers. Cool, calm, engineered, LOTS of small widgets aligned to a strict grid. Feels like a quant trading terminal crossed with LeetCode. Cream background, green used only for data. Tiny FRAME/LIST/OPTIMIZE/WIN chips in table rows.`,
  },
  {
    label: "direction-b-editorial-academy",
    filename: "direction-b-editorial-academy.png",
    prompt: `${sharedPrompt}

Direction B: "Editorial Academy".
Subject: NOT a dashboard. Show a magazine-style READING / library page for company teardown case studies. A large elegant serif, Literata-like headline dominates the top third. Below: big premium magazine-style COVER CARDS for case studies, each a dark forest green #1e3528 rectangle with a large serif title, an author byline row and reading time. Generous whitespace, hairline rules, strong editorial hierarchy, no sidebar, top nav only. Feels like a paid publication, Stratechery / The Atlantic, not a SaaS app. Cream page, dark forest covers, amber only as a tiny accent.`,
  },
  {
    label: "direction-c-crafted-field-guide",
    filename: "direction-c-crafted-field-guide.png",
    prompt: `${sharedPrompt}

Direction C: "Crafted Field Guide".
Subject: a guided STUDY-PLAN journey page. The centerpiece is a vertical winding TRAIL / PATH with numbered circular trail-marker milestones connected by a dashed line, some marked complete with a stamped checkmark, one marked current. Warm cream paper texture background with very subtle grain, thin taupe rules, gentle 8px rounded cards beside the trail, small handwritten-style margin-note annotations. ONE single small friendly line-drawn robot-owl mascot near the top, nothing else cartoonish. Feels like a beautifully designed adult workbook / Brilliant.org, warm but serious. Green + amber trail markers.`,
  },
  {
    label: "direction-d-systems-lab",
    filename: "direction-d-systems-lab.png",
    prompt: `${sharedPrompt}

Direction D: "Systems Lab".
Subject: a SPLIT-PANE engineering workspace, three vertical columns. Left: a slim file/nav rail. Center: a task/brief surface with a challenge spec sheet and a dark forest #14241c terminal/log panel showing monospace log lines. Right: a distinct INSPECTOR PANEL with rubric score rows, evidence bullets, an event-stream timeline with monospace timestamps, and small sparklines. Heavy monospace typography throughout, flat 4px panels, visible pane divider lines, dense and technical. Feels like an IDE / observability tool, Datadog / VS Code, in cream-and-forest. Tiny FRAME/LIST/OPTIMIZE/WIN rubric chips in the inspector. NO soft rounded cards, NO marketing feel.`,
  },
];

async function readApiKey() {
  const env = await readFile(envPath, "utf8");
  const line = env
    .split(/\r?\n/)
    .find((entry) => entry.startsWith("OPENAI_API_KEY="));

  if (!line) {
    throw new Error(`OPENAI_API_KEY was not found in ${envPath}`);
  }

  const key = line.slice("OPENAI_API_KEY=".length).trim();
  if (!key) {
    throw new Error(`OPENAI_API_KEY is empty in ${envPath}`);
  }

  return key;
}

async function generateImage(apiKey, concept, attempt) {
  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt: concept.prompt,
      size: "1536x1024",
      quality: "high",
      n: 1,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(
      `${concept.label} attempt ${attempt} failed: ${response.status} ${response.statusText} ${message}`,
    );
  }

  const payload = await response.json();
  const b64 = payload.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error(`${concept.label} attempt ${attempt} did not return b64_json`);
  }

  const outputPath = path.join(outputDir, concept.filename);
  await writeFile(outputPath, Buffer.from(b64, "base64"));
  return outputPath;
}

async function verifyPng(filePath) {
  const info = await stat(filePath);
  if (info.size <= minBytes) {
    throw new Error(`${path.basename(filePath)} is ${info.size} bytes`);
  }

  const header = await readFile(filePath, { encoding: null });
  const pngSignature = "89504e470d0a1a0a";
  if (header.subarray(0, 8).toString("hex") !== pngSignature) {
    throw new Error(`${path.basename(filePath)} is not a PNG`);
  }

  return info.size;
}

async function generateWithRetry(apiKey, concept) {
  const outputPath = path.join(outputDir, concept.filename);
  let lastError;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      await generateImage(apiKey, concept, attempt);
      const bytes = await verifyPng(outputPath);
      return { concept, outputPath, bytes, attempts: attempt, status: "OK" };
    } catch (error) {
      lastError = error;
    }
  }

  return {
    concept,
    outputPath,
    bytes: 0,
    attempts: 2,
    status: "FAILED",
    error: lastError?.message ?? "Unknown error",
  };
}

await mkdir(outputDir, { recursive: true });

const apiKey = await readApiKey();
const results = [];

for (const concept of concepts) {
  results.push(await generateWithRetry(apiKey, concept));
}

for (const result of results) {
  if (result.status === "OK") {
    console.log(
      `${result.concept.filename}: OK ${result.bytes} bytes (${result.attempts} attempt${result.attempts === 1 ? "" : "s"})`,
    );
  } else {
    console.log(`${result.concept.filename}: FAILED ${result.error}`);
  }
}

if (results.some((result) => result.status !== "OK")) {
  process.exitCode = 1;
}
