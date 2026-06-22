import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getInstagramPosts, getInstagramHandle } from "@/lib/instagram";
import { InstagramGrid } from "@/components/instagram/InstagramGrid";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Eyebrow } from "@/components/ui/Eyebrow";

export const revalidate = 3600; // 1h, allineato alla cache di getInstagramPosts

// ── Metadata ──────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "social" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      siteName: "ENOTEMPO",
      locale: locale === "it" ? "it_IT" : locale === "en" ? "en_US" : "es_ES",
    },
    twitter: {
      card: "summary",
      title: t("metaTitle"),
      description: t("metaDescription"),
    },
    robots: { index: true, follow: true },
  };
}

// ── Page ──────────────────────────────────────────────────────────────────

export default async function SocialPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "social" });
  const posts = await getInstagramPosts();
  const handle = getInstagramHandle();
  const instagramUrl = `https://www.instagram.com/${handle}/`;

  return (
    <>
      {/* ── Hero borgogna ────────────────────────────────────────────── */}
      <section className="bg-borgogna px-4 py-16 md:py-24">
        <div className="container mx-auto max-w-3xl text-center">
          <Eyebrow className="text-verde mb-4 text-[11px]">{t("eyebrow")}</Eyebrow>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium text-crema leading-tight mb-6">
            {t("title")}
          </h1>
          <p className="text-crema/65 text-base md:text-lg mb-8 max-w-xl mx-auto">
            {t("description")}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-[2px] bg-crema text-borgogna border border-crema/60 px-6 py-2.5 text-sm font-medium hover:bg-crema/90 transition-colors"
            >
              {t("openProfile")} ↗
            </a>
            <span className="text-sm text-crema/45">@{handle}</span>
          </div>
        </div>
      </section>

      {/* ── Grid posts ───────────────────────────────────────────────── */}
      <Section bg="bianco-caldo" py="md">
        {posts.length > 0 ? (
          <InstagramGrid posts={posts} columns={3} />
        ) : (
          <div className="text-center py-16">
            <p className="font-serif text-2xl text-borgogna/50 mb-3">{t("noPosts")}</p>
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-verde hover:underline"
            >
              {t("viewAll")} ↗
            </a>
          </div>
        )}

        {posts.length > 0 && (
          <div className="mt-10 text-center">
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-[2px] border-2 border-borgogna bg-transparent px-6 py-2.5 text-sm font-medium text-borgogna hover:bg-borgogna/5 transition-colors"
            >
              {t("viewAll")} ↗
            </a>
          </div>
        )}
      </Section>
    </>
  );
}
