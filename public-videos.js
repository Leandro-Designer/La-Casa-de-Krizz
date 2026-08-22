import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  doc,
  getDoc,
  getFirestore,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const CACHE_KEY = "krizz_videos_cache_v1";
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

async function loadVideosFromFirestore() {
  const slots = Array.from(document.querySelectorAll(".post[data-slot]"))
    .map((el) => el.dataset.slot)
    .filter(Boolean);
  const uniqueSlots = Array.from(new Set(slots));

  const cached = readCache();
  if (cached && typeof cached === "object") {
    for (const slot of uniqueSlots) {
      const entry = cached[slot];
      if (entry) applyVideo(slot, entry.videoId, entry.thumbUrl);
    }
    window.activarModal?.();
    document.documentElement.classList.remove("videos-loading");
  }

  if (!firebaseConfig?.apiKey || !firebaseConfig?.projectId) {
    document.documentElement.classList.remove("videos-loading");
    return;
  }

  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const nextCache = (cached && typeof cached === "object") ? { ...cached } : {};

  try {
    await Promise.all(uniqueSlots.map(async (slot) => {
      const snap = await getDoc(doc(db, "videos", String(slot)));
      if (!snap.exists()) return;
      const data = snap.data() || {};
      applyVideo(slot, data.videoId, data.thumbUrl);
      nextCache[slot] = { videoId: data.videoId || null, thumbUrl: data.thumbUrl || null };
    }));
    writeCache(nextCache);
  } catch (error) {
    console.warn("No se pudieron cargar videos desde Firestore.", error);
  } finally {
    window.activarModal?.();
    document.documentElement.classList.remove("videos-loading");
  }
}

loadVideosFromFirestore();
