import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  doc,
  getDoc,
  getFirestore,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const CACHE_KEY = "krizz_videos_cache_v1";
const FIRESTORE_TIMEOUT_MS = 3500;
const firebaseConfig = window.FIREBASE_CONFIG;

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeCache(cache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore
  }
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      window.setTimeout(() => reject(new Error("Firestore timeout")), ms);
    }),
  ]);
}

function defaultYouTubeThumbUrl(videoId) {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

function updateVideoLd(post, videoId, thumbUrl) {
  const script = post?.querySelector?.('script[type="application/ld+json"].video-ld');
  if (!script || !videoId) return;

  try {
    const data = JSON.parse(script.textContent || "{}");
    data.thumbnailUrl = [thumbUrl || defaultYouTubeThumbUrl(videoId)];
    data.contentUrl = `https://www.youtube.com/watch?v=${videoId}`;
    data.embedUrl = `https://www.youtube.com/embed/${videoId}`;
    script.textContent = JSON.stringify(data, null, 2);
  } catch {
    // keep current structured data if it cannot be parsed
  }
}

function applyVideo(slot, videoId, thumbUrl) {
  if (!videoId) return;
  const post = document.querySelector(`.post[data-slot="${slot}"]`);
  const thumb = post?.querySelector?.(".video-thumb");
  const img = thumb?.querySelector?.("img");
  if (!post || !thumb || !img) return;

  const nextThumb = thumbUrl || defaultYouTubeThumbUrl(videoId);
  thumb.dataset.video = videoId;
  img.src = nextThumb;
  updateVideoLd(post, videoId, nextThumb);
}

function getVideoSlots() {
  return Array.from(document.querySelectorAll(".post[data-slot]"))
    .map((el) => el.dataset.slot)
    .filter(Boolean)
    .filter((slot, index, all) => all.indexOf(slot) === index);
}

async function loadVideosFromFirestore() {
  const slots = getVideoSlots();
  const cached = readCache();

  // The HTML videos are visible immediately. Cache only upgrades them if available.
  if (cached && typeof cached === "object") {
    for (const slot of slots) {
      const entry = cached[slot];
      if (entry) applyVideo(slot, entry.videoId, entry.thumbUrl);
    }
    window.activarModal?.();
  }

  if (!firebaseConfig?.apiKey || !firebaseConfig?.projectId) return;

  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const nextCache = (cached && typeof cached === "object") ? { ...cached } : {};

  try {
    await withTimeout(Promise.all(slots.map(async (slot) => {
      const snap = await getDoc(doc(db, "videos", String(slot)));
      if (!snap.exists()) return;
      const data = snap.data() || {};
      applyVideo(slot, data.videoId, data.thumbUrl);
      nextCache[slot] = { videoId: data.videoId || null, thumbUrl: data.thumbUrl || null };
    })), FIRESTORE_TIMEOUT_MS);
    writeCache(nextCache);
  } catch (error) {
    console.warn("No se pudieron actualizar videos desde Firestore a tiempo.", error);
  } finally {
    window.activarModal?.();
  }
}

window.activarModal?.();
loadVideosFromFirestore();
