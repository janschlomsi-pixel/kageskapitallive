interface InstaVideoPlayerProps {
  src: string;
}

export function InstaVideoPlayer({ src }: InstaVideoPlayerProps) {
  return (
    <div className="w-full max-w-[320px] mx-auto aspect-[9/16] rounded-3xl overflow-hidden shadow-2xl border-4 border-gray-100">
      <video
        className="w-full h-full object-cover"
        controls
        playsInline
        preload="metadata"
        src={src + "#t=0.001"}
      />
    </div>
  );
}
