# La Casa de Krizz

Sitio publico y panel administrativo para gestionar contenido multimedia de Soy El Krizz.

## Stack

- HTML, CSS y JavaScript modular
- Firebase Authentication con login de Google
- Firestore para videos dinamicos, roles y publicaciones del blog
- Cloudinary para miniaturas e imagenes
- Integracion con YouTube mediante ID o URL de video

## Features

- Web publica limpia sin controles administrativos en el DOM
- `/admin/` separado con login y dashboard
- Autenticacion y autorizacion por rol `admin`
- Edicion de "Video mas reciente" y "Contenido destacado" desde Firestore
- Blog dinamico con crear, editar, borrar, fecha, imagen, slug, resumen y contenido
- Footer profesional enlazado al portafolio
- Base SEO con meta tags, Open Graph, sitemap y robots
- Layout responsive

## Estructura

```text
/
├── index.html              # Sitio publico
├── style.css               # Estilos publicos
├── public-blog.js          # Carga publicaciones desde Firestore
├── firebase-config.js      # Config publica de Firebase
├── cloudinary-config.js    # Config publica de Cloudinary
├── firestore.rules         # Reglas recomendadas de seguridad
└── admin/
    ├── index.html          # Dashboard privado
    ├── admin.css
    └── admin.js
```

## Configurar administrador

1. Activa Google como proveedor en Firebase Authentication.
2. Autoriza el dominio del sitio en Authentication > Settings > Authorized domains.
3. Crea un documento en Firestore:

```text
admins/{UID_DEL_USUARIO}
role: "admin"
email: "correo@ejemplo.com"
```

4. Publica `firestore.rules` desde la consola o Firebase CLI.
5. En `admin/admin.js`, cambia `TU_CORREO_ADMIN@gmail.com` por el correo real o elimina esa lista si vas a depender solo del documento `admins/{uid}`.

## Colecciones Firestore

### `videos/{slotId}`

```json
{
  "videoId": "gFSZrlOdkKU",
  "thumbUrl": "https://...",
  "updatedAt": "serverTimestamp"
}
```

### `blogPosts/{postId}`

```json
{
  "title": "Titulo del post",
  "slug": "titulo-del-post",
  "image": "https://...",
  "date": "2026-08-22",
  "excerpt": "Resumen corto",
  "body": "Contenido completo",
  "updatedAt": "serverTimestamp"
}
```

## Capturas sugeridas

- Home publica sin controles admin
- `/admin/` antes del login
- Dashboard con videos y posts
- Formulario de edicion de blog
