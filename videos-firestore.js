import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  setDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

function cfg() {
  const c = window.SITE_CONFIG;
  if (!c || !c.firebase) throw new Error("SITE_CONFIG.firebase no configurado.");
  return c;
}

function ensureFirebaseApp() {
  const { firebase } = cfg();
  if (!firebase.apiKey || !firebase.projectId) {
    throw new Error("Faltan datos de Firebase en SITE_CONFIG.");
  }
  return getApps().length ? getApps()[0] : initializeApp(firebase);
}

function extractYouTubeId(link) {
  // Supports youtu.be/<id> and youtube.com/watch?v=<id>
  const m = String(link).match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function applyVideo(slot, videoId, thumbUrl) {
  const post = document.querySelector(`.post[data-slot="${slot}"]`);
  if (!post) return;

  const thumb = post.querySelector(".video-thumb");
  const img = thumb?.querySelector("img");
  if (!thumb || !img) return;

  if (typeof videoId === "string" && videoId.length === 11) {
    thumb.dataset.video = videoId;
  }

  if (typeof thumbUrl === "string" && thumbUrl.startsWith("http")) {
    img.src = thumbUrl;
  } else if (typeof videoId === "string" && videoId.length === 11) {
    img.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  }
}

async function uploadToCloudinary(file) {
  const { cloudinary } = cfg();
  if (!cloudinary.cloudName || !cloudinary.unsignedUploadPreset) {
    throw new Error("Cloudinary no configurado (cloudName / unsignedUploadPreset).");
  }

  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", cloudinary.unsignedUploadPreset);

  const url = `https://api.cloudinary.com/v1_1/${cloudinary.cloudName}/image/upload`;
  const res = await fetch(url, { method: "POST", body: form });
  if (!res.ok) throw new Error("Cloudinary upload fallo.");
  const data = await res.json();
  if (!data?.secure_url) throw new Error("Cloudinary no devolvio secure_url.");
  return data.secure_url;
}

export async function loadVideosFromFirestore() {
  const app = ensureFirebaseApp();
  const db = getFirestore(app);

  try {
    const snap = await getDocs(collection(db, "videos"));
    snap.forEach((d) => {
      const slot = d.id;
      const data = d.data() || {};
      applyVideo(slot, data.videoId, data.thumbUrl);
    });

    window.activarModal?.();
  } catch (err) {
    // Keep site usable with the hardcoded HTML as a fallback.
    console.warn("No se pudieron cargar videos desde Firestore (se usa HTML fijo).", err);
  }
}

export function bindAdminFirestore() {
  const { admin } = cfg();

  // Hide admin actions by default
  document.querySelectorAll(".btnVideo, .btnThumb").forEach((btn) => {
    btn.style.display = "none";
  });

  async function activarAdmin() {
    const pass = prompt("Contraseña de administrador:");
    if (!admin?.password || pass !== admin.password) {
      alert("Contraseña incorrecta ❌");
      return;
    }

    document.querySelectorAll(".btnVideo, .btnThumb").forEach((b) => {
      b.style.display = "inline-block";
    });

    alert("Modo administrador activado ✔");
  }

  document.querySelectorAll(".adminAccess").forEach((btn) => {
    btn.addEventListener("click", activarAdmin);
  });

  const app = ensureFirebaseApp();
  const db = getFirestore(app);

  document.querySelectorAll(".btnVideo").forEach((btn) => {
    const post = btn.closest(".post");
    const slot = post?.dataset?.slot;
    if (!slot) return;

    btn.addEventListener("click", async () => {
      const link = prompt("Pega el link de YouTube:");
      if (!link) return;

      const videoId = extractYouTubeId(link);
      if (!videoId) {
        alert("Link inválido ❌");
        return;
      }

      try {
        await setDoc(
          doc(db, "videos", String(slot)),
          { videoId, updatedAt: serverTimestamp() },
          { merge: true }
        );
        applyVideo(slot, videoId, null);
        window.activarModal?.();
        alert("Video guardado ✔");
      } catch (err) {
        console.error("Error guardando video en Firestore:", err);
        alert("No se pudo guardar en Firestore. Revisa permisos/reglas.");
      }
    });
  });

  document.querySelectorAll(".btnThumb").forEach((btn) => {
    const post = btn.closest(".post");
    const slot = post?.dataset?.slot;
    if (!slot) return;

    btn.addEventListener("click", async () => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";

      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;

        try {
          const thumbUrl = await uploadToCloudinary(file);
          await setDoc(
            doc(db, "videos", String(slot)),
            { thumbUrl, updatedAt: serverTimestamp() },
            { merge: true }
          );

          const currentId = post?.querySelector(".video-thumb")?.dataset?.video;
          applyVideo(slot, currentId, thumbUrl);
          alert("Thumbnail subido ✔");
        } catch (err) {
          console.error("Error subiendo thumbnail:", err);
          alert("No se pudo subir thumbnail. Revisa Cloudinary/config.");
        }
      };

      input.click();
    });
  });
}

