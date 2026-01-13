import { useEffect, useRef, useState } from "react";

type Props = {
  src: string | null;
  isHost: boolean;

  playback: {
    isPlaying: boolean;
    currentTime: number;
    updatedAt: number;
  } | null;

  onHostPlay: (time: number) => void;
  onHostPause: (time: number) => void;
  onHostSeek: (time: number) => void;
  onHostStatePing: (time: number, playing: boolean) => void;
};

export function SyncedVideoPlayer({
  src,
  isHost,
  playback,
  onHostPlay,
  onHostPause,
  onHostSeek,
  onHostStatePing,
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const pingIntervalRef = useRef<number | null>(null);
  const [needsClick, setNeedsClick] = useState(false);

  const safePlay = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      setNeedsClick(false);
      await video.play();
    } catch {
      setNeedsClick(true);
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video || isHost) return;
    if (!src || !playback) return;

    const apply = async () => {
      if (video.readyState < 1) {
        await new Promise<void>((resolve) => {
          const onLoaded = () => {
            video.removeEventListener("loadedmetadata", onLoaded);
            resolve();
          };
          video.addEventListener("loadedmetadata", onLoaded);
        });
      }

      const drift = Math.abs(video.currentTime - playback.currentTime);
      if (drift > 0.3) video.currentTime = playback.currentTime;

      if (playback.isPlaying) {
        await safePlay();
      } else {
        video.pause();
      }
    };

    apply();
  }, [playback?.isPlaying, playback?.currentTime, playback?.updatedAt, src, isHost]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isHost) return;

    const startPing = () => {
      if (pingIntervalRef.current) window.clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = window.setInterval(() => {
        onHostStatePing(video.currentTime, !video.paused);
      }, 1000);
    };

    const stopPing = () => {
      if (pingIntervalRef.current) {
        window.clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
    };

    const onPlay = () => {
      onHostPlay(video.currentTime);
      startPing();
    };

    const onPause = () => {
      onHostPause(video.currentTime);
      stopPing();
    };

    const onSeeked = () => {
      onHostSeek(video.currentTime);
    };

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("seeked", onSeeked);

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("seeked", onSeeked);
      stopPing();
    };
  }, [isHost, onHostPlay, onHostPause, onHostSeek, onHostStatePing]);

  const onEnablePlayback = async () => {
    await safePlay();
  };

  return (
    <div className="w-full relative">
      {!src ? (
        <div className="text-sm text-gray-600">No video selected yet.</div>
      ) : (
        <>
          <video
            ref={videoRef}
            src={src}
            muted={!isHost}        
            playsInline
            preload="auto"
            controls={isHost}      
            className="w-full rounded-lg border bg-black aspect-video"

          />

          {!isHost && needsClick ? (
            <button
              onClick={onEnablePlayback}
              className="absolute inset-0 flex items-center justify-center bg-black/40 text-white text-sm font-medium rounded-lg"
            >
              Click to start synced playback
            </button>
          ) : null}
        </>
      )}
    </div>
  );
}
