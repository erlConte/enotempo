import Image from "next/image";
import { Play, Images } from "lucide-react";
import type { InstagramPost } from "@/lib/instagram";
import { cn } from "@/lib/utils";

interface InstagramGridProps {
  posts: InstagramPost[];
  columns?: 2 | 3;
}

export function InstagramGrid({ posts, columns = 3 }: InstagramGridProps) {
  if (posts.length === 0) return null;

  return (
    <div
      className={cn(
        "grid gap-2 md:gap-3",
        columns === 3
          ? "grid-cols-2 md:grid-cols-3"
          : "grid-cols-2"
      )}
    >
      {posts.map((post) => (
        <a
          key={post.id}
          href={post.permalink}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={post.caption ? post.caption.slice(0, 80) : "Post Instagram Enotempo"}
          className="group relative block aspect-square overflow-hidden rounded-[2px] bg-borgogna/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borgogna focus-visible:ring-offset-2"
        >
          {post.mediaUrl ? (
            <Image
              src={post.thumbnailUrl ?? post.mediaUrl}
              alt={post.caption ? post.caption.slice(0, 120) : "Enotempo su Instagram"}
              fill
              sizes="(max-width: 768px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            /* Branded placeholder quando mediaUrl è vuoto (mock / errore) */
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-borgogna/20 via-crema/30 to-verde/15">
              <Image
                src="/brand/enotempo-icon.svg"
                alt=""
                width={40}
                height={40}
                className="opacity-30"
              />
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-borgogna/0 group-hover:bg-borgogna/50 transition-colors duration-300 flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center gap-2 text-crema">
              {post.mediaType === "VIDEO" ? (
                <Play className="h-8 w-8 fill-crema" />
              ) : post.mediaType === "CAROUSEL_ALBUM" ? (
                <Images className="h-7 w-7" />
              ) : null}
              {post.caption && (
                <p className="text-xs text-center px-3 line-clamp-3 max-w-[160px] leading-relaxed">
                  {post.caption}
                </p>
              )}
            </div>
          </div>

          {/* Video / carousel badge */}
          {(post.mediaType === "VIDEO" || post.mediaType === "CAROUSEL_ALBUM") && (
            <div className="absolute top-2 right-2 rounded-[2px] bg-black/50 px-1.5 py-0.5 text-[10px] text-white font-medium">
              {post.mediaType === "VIDEO" ? "▶" : "⊞"}
            </div>
          )}
        </a>
      ))}
    </div>
  );
}
