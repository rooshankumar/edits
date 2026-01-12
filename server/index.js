import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// eslint-disable-next-line no-console
console.log("RAPIDAPI_KEY loaded:", Boolean(process.env.RAPIDAPI_KEY));

function isInstagramUrl(url) {
  return /instagram\.com\/(reel|p)\//i.test(url);
}

function isYouTubeUrl(url) {
  return /youtube\.com\/(shorts|watch)/i.test(url) || /youtu\.be\//i.test(url);
}

function extractYouTubeId(inputUrl) {
  try {
    const u = new URL(inputUrl);
    const host = u.hostname.toLowerCase();
    const pathname = u.pathname;

    // youtu.be/<id>
    if (host === "youtu.be") {
      const id = pathname.replace(/^\//, "").split("/")[0];
      return id || null;
    }

    // youtube.com/watch?v=<id>
    const v = u.searchParams.get("v");
    if (v) return v;

    // youtube.com/shorts/<id>
    const shortsMatch = pathname.match(/\/shorts\/([^/?#]+)/i);
    if (shortsMatch?.[1]) return shortsMatch[1];

    // youtube.com/embed/<id>
    const embedMatch = pathname.match(/\/embed\/([^/?#]+)/i);
    if (embedMatch?.[1]) return embedMatch[1];

    return null;
  } catch {
    return null;
  }
}

function pickFirstStringUrl(value) {
  if (!value) return null;
  if (typeof value === "string") return value;
  return null;
}

function extractUrlFromInstagramLinksResponse(data) {
  // Try common shapes
  // - { data: [{ url: "..." }, ...] }
  // - { url: "..." }
  // - { video: "..." }
  const direct = pickFirstStringUrl(data?.url) || pickFirstStringUrl(data?.video) || pickFirstStringUrl(data?.download);
  if (direct) return direct;

  const arr = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : null;
  if (arr && arr.length > 0) {
    for (const item of arr) {
      const u = pickFirstStringUrl(item?.url) || pickFirstStringUrl(item?.download) || pickFirstStringUrl(item?.src);
      if (u) return u;
    }
  }

  const mediaArr = Array.isArray(data?.media) ? data.media : null;
  if (mediaArr && mediaArr.length > 0) {
    for (const item of mediaArr) {
      const u = pickFirstStringUrl(item?.url) || pickFirstStringUrl(item?.download);
      if (u) return u;
    }
  }

  return null;
}

function extractUrlFromYouTubeResponse(data, format) {
  // Try common shapes
  // - { link: "..." }
  // - { url: "..." }
  // - { download: { url: "..." } }
  // - { audio: { url } } / { video: { url } }
  // - { downloadUrl: "..." }
  // - { result: { url: "..." } }
  // - { data: { url: "..." } }
  const direct = pickFirstStringUrl(data?.link) || pickFirstStringUrl(data?.url);
  if (direct) return direct;

  const direct2 = pickFirstStringUrl(data?.downloadUrl) || pickFirstStringUrl(data?.result?.url) || pickFirstStringUrl(data?.data?.url);
  if (direct2) return direct2;

  const nested = pickFirstStringUrl(data?.download?.url) || pickFirstStringUrl(data?.downloadUrl);
  if (nested) return nested;

  // Some APIs return { download_url: "..." }
  const snake = pickFirstStringUrl(data?.download_url) || pickFirstStringUrl(data?.downloadLink);
  if (snake) return snake;

  // youtube-video-fast-downloader-24-7 returns { file, reserved_file }
  const fileUrl = pickFirstStringUrl(data?.file) || pickFirstStringUrl(data?.reserved_file);
  if (fileUrl) return fileUrl;

  if (format === "mp3") {
    const audioUrl = pickFirstStringUrl(data?.audio?.url) || pickFirstStringUrl(data?.audio?.download);
    if (audioUrl) return audioUrl;
  }

  if (format === "mp4") {
    const videoUrl = pickFirstStringUrl(data?.video?.url) || pickFirstStringUrl(data?.video?.download);
    if (videoUrl) return videoUrl;
  }

  // arrays
  const candidates = [];
  if (Array.isArray(data?.links)) candidates.push(...data.links);
  if (Array.isArray(data?.formats)) candidates.push(...data.formats);
  if (Array.isArray(data?.videos)) candidates.push(...data.videos);
  if (Array.isArray(data?.audios)) candidates.push(...data.audios);

  for (const item of candidates) {
    const u = pickFirstStringUrl(item?.url) || pickFirstStringUrl(item?.link) || pickFirstStringUrl(item?.download);
    if (u) return u;
  }

  return null;
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/download", async (req, res) => {
  try {
    const { url, format } = req.body ?? {};

    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "Missing url" });
    }

    if (format !== "mp3" && format !== "mp4") {
      return res.status(400).json({ error: "Invalid format (must be mp3 or mp4)" });
    }

    const rapidKey =
      process.env.RAPIDAPI_KEY ||
      process.env.X_RAPIDAPI_KEY ||
      process.env.RAPID_API_KEY;
    if (!rapidKey) {
      return res.status(500).json({
        error: "Server not configured: RAPIDAPI_KEY missing",
        envChecked: {
          RAPIDAPI_KEY: Boolean(process.env.RAPIDAPI_KEY),
          X_RAPIDAPI_KEY: Boolean(process.env.X_RAPIDAPI_KEY),
          RAPID_API_KEY: Boolean(process.env.RAPID_API_KEY),
        },
      });
    }

    if (isInstagramUrl(url)) {
      // instagram120 endpoint: POST /api/instagram/links
      const host = "instagram120.p.rapidapi.com";
      const apiUrl = `https://${host}/api/instagram/links`;

      const r = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "X-RapidAPI-Key": rapidKey,
          "X-RapidAPI-Host": host,
        },
        body: JSON.stringify({ url }),
      });

      const data = await r.json().catch(() => null);
      if (!r.ok) {
        return res.status(502).json({ error: "Instagram provider error", details: data });
      }

      const downloadUrl = extractUrlFromInstagramLinksResponse(data);
      if (!downloadUrl) {
        return res.status(502).json({ error: "Could not extract Instagram download URL", details: data });
      }

      return res.json({ provider: "instagram", format: "mp4", downloadUrl });
    }

    if (isYouTubeUrl(url)) {
      // Use ⚡ YouTube Video FAST Downloader 24/7
      // Host: youtube-video-fast-downloader-24-7.p.rapidapi.com
      // Endpoints include:
      // - Get Video Download URL
      // - Get Shorts Download URL
      // - Get Audio Download URL
      const host = "youtube-video-fast-downloader-24-7.p.rapidapi.com";
      const base = `https://${host}`;

      const videoId = extractYouTubeId(url);
      if (!videoId) {
        return res.status(400).json({ error: "Could not extract YouTube video id from URL" });
      }

      // 1) Query qualities
      const qualitiesUrl = `${base}/get_available_quality/${encodeURIComponent(videoId)}`;
      const qRes = await fetch(qualitiesUrl, {
        method: "GET",
        headers: {
          "X-RapidAPI-Key": rapidKey,
          "X-RapidAPI-Host": host,
        },
      });
      const qData = await qRes.json().catch(() => null);
      if (!qRes.ok) {
        return res.status(502).json({ error: "YouTube provider error (qualities)", details: qData });
      }

      // Pick a quality id (prefer mp4 for video, prefer audio for mp3)
      const list = Array.isArray(qData) ? qData : Array.isArray(qData?.qualities) ? qData.qualities : Array.isArray(qData?.data) ? qData.data : null;
      let chosenQuality = null;
      if (list && list.length > 0) {
        // Look for objects like { quality: '247', ... } or { itag: 247 }
        const pickFrom = (predicate) => {
          for (const item of list) {
            if (!item || typeof item !== "object") continue;
            if (!predicate(item)) continue;
            const q = pickFirstStringUrl(item.quality) || pickFirstStringUrl(item.itag) || (typeof item.itag === "number" ? String(item.itag) : null);
            if (q) return q;
          }
          return null;
        };

        if (format === "mp3") {
          chosenQuality = pickFrom((it) => {
            const t = String(it.type || it.mimeType || it.mime_type || "").toLowerCase();
            const hasAudio = Boolean(it.audio) || t.includes("audio");
            return hasAudio;
          });
        } else {
          chosenQuality = pickFrom((it) => {
            const t = String(it.type || it.mimeType || it.mime_type || "").toLowerCase();
            const hasVideo = Boolean(it.video) || t.includes("video");
            return hasVideo;
          });
        }

        // fallback to first
        if (!chosenQuality) {
          const first = list[0];
          chosenQuality = pickFirstStringUrl(first?.quality) || pickFirstStringUrl(first?.itag) || (typeof first?.itag === "number" ? String(first.itag) : null);
        }
      }

      if (!chosenQuality) {
        // documented examples: 247 for video, 251 for audio
        chosenQuality = format === "mp3" ? "251" : "247";
      }

      const isShorts = /youtube\.com\/shorts\//i.test(url);
      const dlEndpoint = format === "mp3"
        ? "download_audio"
        : (isShorts ? "download_short" : "download_video");

      const apiUrl = `${base}/${dlEndpoint}/${encodeURIComponent(videoId)}?quality=${encodeURIComponent(chosenQuality)}`;

      const r = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "X-RapidAPI-Key": rapidKey,
          "X-RapidAPI-Host": host,
        },
      });

      const data = await r.json().catch(() => null);
      if (!r.ok) {
        return res.status(502).json({ error: "YouTube provider error", details: data });
      }

      const downloadUrl = extractUrlFromYouTubeResponse(data, format);
      if (!downloadUrl) {
        return res.status(502).json({ error: "Could not extract YouTube download URL", details: data });
      }

      return res.json({ provider: "youtube", format, downloadUrl });
    }

    return res.status(400).json({ error: "Unsupported URL (only YouTube + Instagram supported)" });
  } catch (e) {
    return res.status(500).json({ error: "Server error", message: e instanceof Error ? e.message : String(e) });
  }
});

const port = Number(process.env.PORT || 5175);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Downloader API listening on http://localhost:${port}`);
});
