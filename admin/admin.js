import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = window.FIREBASE_CONFIG;
const ADMIN_EMAILS = ["TU_CORREO_ADMIN@gmail.com"]; // Cambia esto por el correo real del admin.
const VIDEO_SLOTS = [
  { id: "1", label: "Video mas reciente" },
  { id: "2", label: "Contenido destacado" },
];

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

const $ = (id) => document.getElementById(id);
const statusEl = $("status");
const userInfoEl = $("userInfo");
const btnSignIn = $("btnSignIn");
const btnSignOut = $("btnSignOut");
const dashboard = $("dashboard");
const videoPanel = $("videoPanel");
const blogPanel = $("blogPanel");
const videoEditor = $("videoEditor");
const blogForm = $("blogForm");
const postsList = $("postsList");
let blogPosts = [];

function setStatus(message) {
  statusEl.textContent = message || "";
}

function showAdminUI(show) {
  dashboard.hidden = !show;
  videoPanel.hidden = !show;
  blogPanel.hidden = !show;
  btnSignOut.hidden = !show;
  btnSignIn.hidden = show;
}

function normalizeYouTubeId(value) {
  const s = String(value || "").trim();
  if (!s) return null;
  const direct = s.match(/^([a-zA-Z0-9_-]{11})/);
  if (direct) return direct[1];
  const url = s.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/);
  return url ? url[1] : null;
}

function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function isAdmin(user) {
  if (!user) return false;
  if (ADMIN_EMAILS.includes(user.email)) return true;
  const snap = await getDoc(doc(db, "admins", user.uid));
  return snap.exists() && snap.data()?.role === "admin";
}

function renderVideoRows(values = {}) {
  videoEditor.innerHTML = "";
  VIDEO_SLOTS.forEach((slot) => {
    const data = values[slot.id] || {};
    const row = document.createElement("div");
    row.className = "admin-row";
    row.dataset.slot = slot.id;
    row.innerHTML = `
      <label>${slot.label}</label>
      <input class="videoInput" value="${data.videoId || ""}" placeholder="Link o ID de YouTube">
      <input class="thumbInput" value="${data.thumbUrl || ""}" placeholder="Miniatura opcional https://...">
      <button class="btnLink btnVideoSave" type="button">Guardar</button>
    `;
    videoEditor.appendChild(row);
  });
}

async function loadVideos() {
  const values = {};
  await Promise.all(VIDEO_SLOTS.map(async (slot) => {
    const snap = await getDoc(doc(db, "videos", slot.id));
    if (snap.exists()) values[slot.id] = snap.data();
  }));
  renderVideoRows(values);
  $("videosCount").textContent = String(Object.keys(values).length);
}

async function saveVideo(row) {
  const slot = row.dataset.slot;
  const videoId = normalizeYouTubeId(row.querySelector(".videoInput").value);
  const thumbUrl = row.querySelector(".thumbInput").value.trim();
  if (!videoId) {
    setStatus("Pega un link o ID valido de YouTube.");
    return;
  }
  await setDoc(doc(db, "videos", slot), {
    videoId,
    thumbUrl: thumbUrl || null,
    updatedAt: serverTimestamp(),
  }, { merge: true });
  setStatus(`Video guardado en slot ${slot}.`);
  await loadVideos();
}

function readPostForm() {
  const title = $("postTitle").value.trim();
  const slug = slugify($("postSlug").value || title);
  return {
    id: $("postId").value || slug,
    title,
    slug,
    image: $("postImage").value.trim(),
    date: $("postDate").value,
    excerpt: $("postExcerpt").value.trim(),
    body: $("postBody").value.trim(),
  };
}

function fillPostForm(post = {}) {
  $("postId").value = post.id || "";
  $("postTitle").value = post.title || "";
  $("postSlug").value = post.slug || "";
  $("postImage").value = post.image || "";
  $("postDate").value = post.date || new Date().toISOString().slice(0, 10);
  $("postExcerpt").value = post.excerpt || "";
  $("postBody").value = post.body || "";
}

function renderPosts() {
  postsList.innerHTML = "";
  $("postsCount").textContent = String(blogPosts.length);
  if (!blogPosts.length) {
    postsList.innerHTML = '<p class="admin-meta">Todavia no hay publicaciones.</p>';
    return;
  }
  blogPosts.forEach((post) => {
    const item = document.createElement("article");
    item.className = "post-admin-item";
    item.innerHTML = `
      <div>
        <h3>${post.title}</h3>
        <p>${post.date || "Sin fecha"} / ${post.slug}</p>
      </div>
      <div class="btnGroup">
        <button class="btnLink secondary" data-edit="${post.id}" type="button">Editar</button>
        <button class="btnLink" data-delete="${post.id}" type="button">Borrar</button>
      </div>
    `;
    postsList.appendChild(item);
  });
}

async function loadPosts() {
  const snap = await getDocs(query(collection(db, "blogPosts"), orderBy("date", "desc")));
  blogPosts = snap.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
  renderPosts();
}

async function savePost(event) {
  event.preventDefault();
  const post = readPostForm();
  if (!post.title || !post.slug || !post.date || !post.excerpt || !post.body) {
    setStatus("Completa titulo, slug, fecha, resumen y contenido.");
    return;
  }
  await setDoc(doc(db, "blogPosts", post.id), {
    title: post.title,
    slug: post.slug,
    image: post.image || null,
    date: post.date,
    excerpt: post.excerpt,
    body: post.body,
    updatedAt: serverTimestamp(),
  }, { merge: true });
  setStatus("Post guardado.");
  fillPostForm();
  await loadPosts();
}

btnSignIn.addEventListener("click", async () => {
  setStatus("");
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error(error);
    setStatus(error?.code === "auth/unauthorized-domain"
      ? "Autoriza este dominio en Firebase Authentication."
      : "No se pudo iniciar sesion.");
  }
});

btnSignOut.addEventListener("click", () => signOut(auth));

videoEditor.addEventListener("click", async (event) => {
  const button = event.target.closest(".btnVideoSave");
  if (!button) return;
  try {
    await saveVideo(button.closest(".admin-row"));
  } catch (error) {
    console.error(error);
    setStatus(error?.code === "permission-denied" ? "Permiso denegado por Firestore Rules." : "No se pudo guardar el video.");
  }
});

blogForm.addEventListener("submit", async (event) => {
  try {
    await savePost(event);
  } catch (error) {
    console.error(error);
    setStatus(error?.code === "permission-denied" ? "Permiso denegado por Firestore Rules." : "No se pudo guardar el post.");
  }
});

$("btnResetPost").addEventListener("click", () => fillPostForm());
$("postTitle").addEventListener("input", () => {
  if (!$("postId").value) $("postSlug").value = slugify($("postTitle").value);
});

postsList.addEventListener("click", async (event) => {
  const editId = event.target.dataset.edit;
  const deleteId = event.target.dataset.delete;
  if (editId) {
    fillPostForm(blogPosts.find((post) => post.id === editId));
    return;
  }
  if (deleteId && confirm("Borrar esta publicacion?")) {
    await deleteDoc(doc(db, "blogPosts", deleteId));
    setStatus("Post borrado.");
    await loadPosts();
  }
});

onAuthStateChanged(auth, async (user) => {
  showAdminUI(false);
  userInfoEl.textContent = "";
  if (!user) return;

  userInfoEl.textContent = `Sesion iniciada: ${user.email || user.uid}`;
  try {
    const allowed = await isAdmin(user);
    if (!allowed) {
      setStatus("Tu cuenta inicio sesion, pero no tiene rol admin.");
      await signOut(auth);
      return;
    }
    showAdminUI(true);
    setStatus("Acceso admin confirmado.");
    await Promise.all([loadVideos(), loadPosts()]);
    fillPostForm();
  } catch (error) {
    console.error(error);
    setStatus("No se pudo verificar el rol admin.");
  }
});
