import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BIDKU - Platform Lelang Digital Terpercaya",
    short_name: "BIDKU",
    description:
      "Ikuti lelang kendaraan dan aset berkualitas secara real-time bersama BIDKU.",
    start_url: "/bidder/home",
    scope: "/",
    display: "standalone",
    background_color: "#F9F8F3",
    theme_color: "#f67904",
    lang: "id",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
