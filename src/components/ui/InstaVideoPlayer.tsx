import { useRef, useState } from "react";

interface InstaVideoPlayerProps {
  src: string;
}

export function InstaVideoPlayer({ src }: InstaVideoPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePlay = () => {
    setPlaying(true);
    videoRef.current?.play();
  };

  return (
    <div className="w-full max-w-[320px] mx-auto aspect-[9/16] rounded-3xl overflow-hidden shadow-2xl border-4 border-gray-100 bg-black relative">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        controls={playing}
        playsInline
        preload="metadata"
        src={src + "#t=0.001"}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />

      {/* Play Button Overlay — hidden while playing */}
      {!playing && (
        <button
          onClick={handlePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/20 group cursor-pointer"
          aria-label="Video abspielen"
        >
          <div className="w-20 h-20 rounded-full bg-[#d4af37] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <svg className="w-8 h-8 text-[#0f172a] ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </button>
      )}
    </div>
  );
}
