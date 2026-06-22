import Link from "next/link";
import { getInstagramPosts, getInstagramHandle } from "@/lib/instagram";
import { InstagramGrid } from "@/components/instagram/InstagramGrid";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Section } from "@/components/ui/Section";

// Mostra gli ultimi 6 post + CTA verso la pagina /social
export default async function InstagramFeed({ locale }: { locale: string }) {
  const posts = await getInstagramPosts(6);
  const handle = getInstagramHandle();
  const instagramUrl = `https://www.instagram.com/${handle}/`;

  return (
    <Section bg="crema">
      <SectionHeading
        eyebrow="Social"
        title="Seguici su Instagram"
        align="center"
        className="mb-12"
      />

      {posts.length > 0 ? (
        <InstagramGrid posts={posts} columns={3} />
      ) : (
        <p className="text-center text-marrone-scuro/60 py-8">
          Nessun contenuto disponibile al momento.
        </p>
      )}

      <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link
          href={`/${locale}/social`}
          className="inline-flex items-center gap-2 rounded-[2px] border-2 border-borgogna bg-transparent px-6 py-2.5 text-sm font-medium text-borgogna hover:bg-borgogna/5 transition-colors"
        >
          Vedi tutto su Instagram →
        </Link>
        <a
          href={instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-marrone-scuro/60 hover:text-borgogna transition-colors"
        >
          @{handle}
        </a>
      </div>
    </Section>
  );
}
