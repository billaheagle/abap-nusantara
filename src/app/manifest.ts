import type { MetadataRoute } from "next";

// For "Add to Home screen" on Android. Kept static (no settings read) so it
// builds without the database; iPhones use the apple-touch-icon in the layout.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ABAP Nusantara",
    short_name: "ABAP Nusantara",
    description: "Blog teknis tentang belajar SAP BTP, ABAP, Integration Suite/CPI, OData, CAP, dan Fiori/UI5.",
    lang: "id",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f5fa",
    theme_color: "#f4f5fa",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/logo-512.png", sizes: "512x512", type: "image/png" },
      { src: "/brand/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
