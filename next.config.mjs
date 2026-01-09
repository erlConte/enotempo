import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin('./i18n.ts');

/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Abilita l'output statico per next build/export
  // output: 'export', // decommentare se si vuole fare export statico completo
  images: {
    // Necessario se si usa <Image /> con next export
    unoptimized: false, // impostare a true solo se si usa output: 'export'
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
      {
        protocol: "https",
        hostname: "*.blob.vercel-storage.com",
      },
    ],
  },
};

export default withNextIntl(nextConfig);

