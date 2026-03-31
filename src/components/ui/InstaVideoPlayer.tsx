import { useState } from "react";

interface InstaVideoPlayerProps {
  src: string;
}

export function InstaVideoPlayer({ src }: InstaVideoPlayerProps) {
  const [started, setStarted] = useState(false);

  return (
    <div className="w-full max-w-[320px] mx-auto aspect-[9/16] rounded-3xl overflow-hidden shadow-2xl border-4 border-gray-100 bg-black">
      {!started ? (
        <button
          onClick={() => setStarted(true)}
          className="relative w-full h-full flex items-center justify-center bg-gradient-to-b from-gray-800 to-gray-900 group cursor-pointer"
          aria-label="Video abspielen"
        >
          {/* Play Button */}
          <div className="w-20 h-20 rounded-full bg-[#d4af37] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <svg className="w-8 h-8 text-[#0f172a] ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <span className="absolute bottom-6 text-white/60 text-sm">Tippen zum Abspielen</span>
        </button>
      ) : (
        <video
          className="w-full h-full object-cover"
          controls
          playsInline
          autoPlay
          preload="none"
          src={src}
        />
      )}
    </div>
  );
}
