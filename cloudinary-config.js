// Cloudinary public config used for browser uploads.
//
// SECURITY NOTE:
// - Unsigned upload presets can be abused if left unrestricted.
// - In Cloudinary, restrict the preset: allowed formats (jpg/png/webp), max file size,
//   and ideally a fixed folder for this project.
//
// Fill these values from your Cloudinary dashboard.
window.CLOUDINARY_CONFIG = {
  cloudName: "dsjlddhij",
  unsignedUploadPreset: "Home-Krizz",
  // Optional: forces uploads into a folder (if your preset allows it).
  folder: "krizz/thumbs",
};
