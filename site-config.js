// Firestore + Cloudinary config used by the browser.
// This file is expected to be public for GitHub Pages; do NOT put private keys here.
// Security must be enforced with Firestore rules and API key restrictions (HTTP referrers).

window.SITE_CONFIG = {
  firebase: {
    apiKey: "",
    authDomain: "",
    projectId: "",
    appId: "",
    measurementId: "",
  },
  cloudinary: {
    cloudName: "",
    unsignedUploadPreset: "",
  },
  // UI gating only (not security). Real security must be in Firestore rules.
  admin: {
    password: "",
  },
};

