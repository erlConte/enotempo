"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Play } from "lucide-react";

interface VideoShadowboxProps {
  videoSrc: string;
  title: string;
  poster?: string;
}

export default function VideoShadowbox({
  videoSrc,
  title,
  poster = "/branding/logo-borgogna.jpg",
}: VideoShadowboxProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="relative aspect-video w-full max-w-3xl mx-auto cursor-pointer group overflow-hidden rounded-2xl shadow-sm">
          <Image
            src={poster}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 896px"
          />
          {/* Overlay con icona Play */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/50 transition-colors">
            <div className="w-20 h-20 rounded-full bg-borgogna/90 flex items-center justify-center shadow-lg group-hover:bg-borgogna transition-colors">
              <Play className="w-10 h-10 text-bianco-caldo ml-1" fill="currentColor" />
            </div>
          </div>
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-4xl w-full p-0 bg-black/95 border-none">
        <div className="aspect-video w-full overflow-hidden">
          <iframe
            src={videoSrc}
            title={title}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
