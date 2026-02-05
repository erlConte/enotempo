"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface VideoWithModalProps {
  videoUrl: string;
  poster?: string;
  className?: string;
}

export default function VideoWithModal({ videoUrl, poster, className = "" }: VideoWithModalProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <>
      {/* Video nella colonna, con clic per ingrandirlo */}
      <div className={`video-section ${className}`}>
        <div className="video-container aspect-[9/16] w-full max-h-[80vh] rounded-xl overflow-hidden bg-marrone-scuro/10 shadow-lg cursor-pointer hover:shadow-xl transition-shadow" onClick={openModal}>
          <video 
            width="100%" 
            height="auto" 
            controls
            className="w-full h-full object-contain"
            poster={poster}
            onClick={(e) => {
              e.stopPropagation();
              openModal();
            }}
          >
            <source src={videoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </div>

      {/* Modal per visualizzare il video ingrandito */}
      {isModalOpen && (
        <div className="video-modal-overlay" onClick={closeModal}>
          <div className="video-modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="video-modal-close-button" 
              onClick={closeModal}
              aria-label="Chiudi"
            >
              <X className="w-6 h-6" />
            </button>
            <video
              controls
              className="video-modal-video"
              autoPlay
            >
              <source src={videoUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      )}
    </>
  );
}
