# La Casa de Krizz

Sitio público y panel administrativo para gestionar contenido multimedia de Soy El Krizz. La web pública queda limpia para visitantes, mientras que `/admin/` concentra la gestión de videos, publicaciones del blog y acceso protegido.

## Links

- Web pública: https://leandro-designer.github.io/La-Casa-de-Krizz/
- Panel admin: https://leandro-designer.github.io/La-Casa-de-Krizz/admin/

## Stack

- **Frontend:** HTML5, CSS3 y JavaScript modular.
- **Autenticación:** Firebase Authentication con proveedor Google.
- **Base de datos:** Cloud Firestore para videos dinámicos, blog y roles.
- **Autorización:** documento `admins/{uid}` + reglas de Firestore.
- **Multimedia:** integración con YouTube por ID o URL y miniaturas externas.
- **Imágenes:** Cloudinary preparado para miniaturas e imágenes del contenido.
- **SEO:** meta description, Open Graph, Twitter Card, canonical, sitemap y robots.
- **Deploy:** GitHub Pages.

## Features

- Web pública sin controles administrativos en el DOM.
- `/admin/` separado con login y dashboard.
- Autenticación y autorización por rol `admin`.
- Videos dinámicos para "Video más reciente" y "Contenido destacado".
- Blog CRUD con crear, editar, borrar, fecha, imagen, slug, resumen y contenido.
- Lectura pública desde Firestore y escritura restringida al admin.
- Carga rápida de videos: HTML visible al instante y Firestore actualiza en segundo plano.
- Footer profesional enlazado al portafolio.
- Diseño responsive.

## Capturas

> Agrega las imágenes dentro de `docs/screenshots/` y actualiza estas rutas cuando tengas las capturas finales.

| Vista | Captura |
| --- | --- |
| Home pública | `docs/screenshots/home-publica.png` |
| Videos dinámicos | `docs/screenshots/videos-dinamicos.png` |
| Login admin | `docs/screenshots/admin-login.png` |
| Dashboard admin | `docs/screenshots/admin-dashboard.png` |
| Blog CRUD | `docs/screenshots/blog-crud.png` |

## Arquitectura

```text
/
├── index.html              # Sitio público
├── style.css               # Estilos públicos
├── public-videos.js        # Carga videos desde Firestore sin bloquear el HTML
├── public-blog.js          # Carga publicaciones públicas desde Firestore
├── firebase-config.js      # Config pública de Firebase Web SDK
├── cloudinary-config.js    # Config pública de Cloudinary
├── firestore.rules         # Reglas de seguridad recomendadas
└── admin/
    ├── index.html          # Dashboard privado
    ├── admin.css           # Estilos del panel
    └── admin.js            # Auth, roles, videos y blog CRUD
```

## Firebase Auth + Firestore

El panel usa Firebase Authentication para iniciar sesión con Google. Iniciar sesión no basta para administrar: después del login, `admin/admin.js` verifica si el usuario tiene autorización consultando Firestore.

El rol se define en:

```text
admins/{UID_DEL_USUARIO}
role: "admin"
email: "correo@ejemplo.com"
```

Esto permite explicar dos conceptos separados:

- **Autenticación:** comprobar quién es el usuario con Firebase Auth.
- **Autorización:** comprobar qué puede hacer ese usuario mediante el rol `admin`.

## Reglas de Firestore

`firestore.rules` permite lectura pública de `videos` y `blogPosts`, pero restringe escritura solo a usuarios con rol admin.

```js
function isAdmin() {
  return request.auth != null
    && exists(/databases/$(database)/documents/admins/$(request.auth.uid))
    && get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.role == 'admin';
}
```

## CRUD del blog

La colección `blogPosts` almacena publicaciones editables desde `/admin/`.

```json
{
  "title": "Título del post",
  "slug": "titulo-del-post",
  "image": "https://...",
  "date": "2026-08-22",
  "excerpt": "Resumen corto",
  "body": "Contenido completo",
  "updatedAt": "serverTimestamp"
}
```

Operaciones disponibles:

- **Crear:** formulario del dashboard admin.
- **Leer:** blog público desde `public-blog.js`.
- **Editar:** botón Editar en la lista de posts.
- **Borrar:** botón Borrar protegido por reglas de Firestore.

## Videos dinámicos

La colección `videos` controla los slots publicados en la home.

```json
{
  "videoId": "gFSZrlOdkKU",
  "thumbUrl": "https://...",
  "updatedAt": "serverTimestamp"
}
```

`public-videos.js` muestra los videos base del HTML inmediatamente, aplica caché local si existe y luego actualiza desde Firestore en segundo plano. Esto evita que la página pública dependa de la latencia de Firebase para mostrar el contenido principal.

## Configurar administrador

1. Activa Google como proveedor en Firebase Authentication.
2. Autoriza el dominio del sitio en Authentication > Settings > Authorized domains.
3. Crea el documento `admins/{UID_DEL_USUARIO}` con `role: "admin"`.
4. Publica `firestore.rules` desde Firebase Console o Firebase CLI.
5. En `admin/admin.js`, cambia `TU_CORREO_ADMIN@gmail.com` por el correo real o elimina esa lista si vas a depender solo del documento `admins/{uid}`.
