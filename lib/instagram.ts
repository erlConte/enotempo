export type InstagramPost = {
  id: string;
  permalink: string;
  mediaUrl: string;
  thumbnailUrl?: string;
  caption?: string;
  mediaType: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
};

const INSTAGRAM_HANDLE =
  process.env.NEXT_PUBLIC_INSTAGRAM_HANDLE ?? "enotempo.italia";

// ── Behold.so response shape ───────────────────────────────────────────────
// https://developers.behold.so/docs/api
type BeholdPost = {
  id: string;
  permalink: string;
  mediaUrl: string;
  thumbnailUrl?: string;
  caption?: string;
  mediaType: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
};
type BeholdResponse = { posts: BeholdPost[] };

// ── Mock data (used when BEHOLD_FEED_URL is not set) ──────────────────────
// mediaUrl is left empty so the grid shows a branded placeholder.
// Replace with real posts once Behold (or another source) is configured.
const MOCK_POSTS: InstagramPost[] = Array.from({ length: 9 }, (_, i) => ({
  id: `mock-${i}`,
  permalink: `https://www.instagram.com/${INSTAGRAM_HANDLE}/`,
  mediaUrl: "",
  mediaType: "IMAGE" as const,
  caption: `Enotempo — esperienze enogastronomiche interculturali`,
}));

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Returns Instagram posts from Behold.so (if BEHOLD_FEED_URL is set)
 * or falls back to mock data.
 * Cache: 1 hour (ISR-compatible).
 */
export async function getInstagramPosts(limit?: number): Promise<InstagramPost[]> {
  const feedUrl = process.env.BEHOLD_FEED_URL;

  if (feedUrl) {
    try {
      const res = await fetch(feedUrl, { next: { revalidate: 3600 } });
      if (!res.ok) throw new Error(`Behold fetch failed: ${res.status}`);
      const data: BeholdResponse = await res.json();
      const posts: InstagramPost[] = (data.posts ?? []).map((p) => ({
        id: p.id,
        permalink: p.permalink,
        mediaUrl: p.mediaUrl ?? "",
        thumbnailUrl: p.thumbnailUrl,
        caption: p.caption,
        mediaType: p.mediaType ?? "IMAGE",
      }));
      return limit ? posts.slice(0, limit) : posts;
    } catch (err) {
      console.error("[instagram] fetch error, falling back to mock:", err);
    }
  }

  const posts = MOCK_POSTS;
  return limit ? posts.slice(0, limit) : posts;
}

export function getInstagramHandle(): string {
  return INSTAGRAM_HANDLE;
}
