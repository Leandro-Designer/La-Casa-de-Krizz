import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  collection,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const target = document.getElementById("blogPosts");
const firebaseConfig = window.FIREBASE_CONFIG;

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderPosts(posts) {
  if (!target) return;
  if (!posts.length) {
    target.innerHTML = '<p class="blog-empty">Pronto habra nuevas publicaciones.</p>';
    return;
  }

  target.innerHTML = posts.map((post) => `
    <article class="blog-preview" id="${escapeHtml(post.slug || post.id)}">
      ${post.image ? `<img src="${escapeHtml(post.image)}" alt="Imagen de ${escapeHtml(post.title)}" loading="lazy">` : ""}
      <span>${escapeHtml(post.date || "")}</span>
      <h4>${escapeHtml(post.title)}</h4>
      <p>${escapeHtml(post.excerpt)}</p>
    </article>
  `).join("");
}

async function loadBlogPosts() {
  if (!target || !firebaseConfig?.apiKey || !firebaseConfig?.projectId) return;
  try {
    const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const snap = await getDocs(query(collection(db, "blogPosts"), orderBy("date", "desc"), limit(4)));
    renderPosts(snap.docs.map((entry) => ({ id: entry.id, ...entry.data() })));
  } catch (error) {
    console.warn("No se pudieron cargar posts del blog.", error);
  }
}

loadBlogPosts();
