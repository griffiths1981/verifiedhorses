"use client";

import { useState } from "react";

export function VideoFacade({
  provider,
  videoId,
  poster,
  title,
}: {
  provider: string;
  videoId: string;
  poster: string;
  title: string;
}) {
  const [play, setPlay] = useState(false);
  const src =
    provider === "vimeo"
      ? `https://player.vimeo.com/video/${videoId}?dnt=1`
      : `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`;
  if (play) {
    return (
      <div className="video-frame">
        <iframe
          src={src}
          title={title}
          allow="fullscreen; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          style={{ width: "100%", aspectRatio: "16 / 9", border: 0 }}
        />
      </div>
    );
  }
  return (
    <button
      type="button"
      className="video-frame video-poster"
      onClick={() => setPlay(true)}
      style={poster ? { backgroundImage: `url("${poster}")` } : undefined}
    >
      <span className="play" aria-hidden="true">▶</span>
      <span className="sr">Play {title}. The player loads when you press this.</span>
    </button>
  );
}
