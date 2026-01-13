import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useRoom } from "../features/room/useRoom";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { uploadVideo } from "../features/room/room.api";
import { SyncedVideoPlayer } from "../features/room/SyncedVideoPlayer";
import { useRef } from "react";


export default function RoomPage() {
  const { roomId = "" } = useParams();
  const [search] = useSearchParams();
  const name = useMemo(() => search.get("name") || "User", [search]);
  const navigate = useNavigate();

  const {
    room,
    socketId,
    joinRoom,
    claimHost,
    leaveRoom,
    setRoomVideo,
    play,
    pause,
    seek,
    statePing,
  } = useRoom();

  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setJoining(true);
      const ack = await joinRoom({ roomId, name });

      if (cancelled) return;

      if (!ack?.ok) setError(ack?.message || "Failed to join room");
      else setError(null);

      setJoining(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [roomId, name]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);


  const hasHost = Boolean(room?.hostSocketId);
  const isHost = Boolean(
    room?.hostSocketId && socketId && socketId === room.hostSocketId
  );

  const src = room?.playback?.streamUrl
    ? `${import.meta.env.VITE_API_BASE_URL}${room.playback.streamUrl}`
    : null;

  const statusText = room?.playback?.isPlaying ? "Playing" : "Paused";

  const onLeave = async () => {
    await leaveRoom();
    navigate("/");
  };

  const onClaimHost = async () => {
    setError(null);
    const ack = await claimHost(roomId);
    if (!ack?.ok) setError(ack?.reason || ack?.message || "Cannot claim host");
  };

  const onPickVideo = async (file: File) => {
    try {
      setError(null);
      setUploading(true);

      const res = await uploadVideo(file);
      if (!res.success) {
        setError("Upload failed");
        return;
      }

      const ack = await setRoomVideo(roomId, res.video.id, res.streamUrl);
      if (!ack.ok) {
        setError(ack.message || "Only host can set video");
        return;
      }
    } catch (e: any) {
      setError(e?.message || "Upload error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Top Bar */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Room: {roomId}</h1>
            <p className="text-sm text-gray-600">
              Signed in as <span className="font-medium">{name}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!hasHost ? (
              <Button onClick={onClaimHost} disabled={joining}>
                Become Host
              </Button>
            ) : isHost ? (
              <span className="px-3 py-2 rounded-md bg-black text-white text-sm">
                Host
              </span>
            ) : (
              <span className="px-3 py-2 rounded-md bg-gray-200 text-sm">
                Viewer
              </span>
            )}

            <Button variant="ghost" onClick={onLeave}>
              Leave
            </Button>
          </div>
        </div>

        {joining ? (
          <div className="rounded-md border bg-white p-3 text-sm">
            Joining room...
          </div>
        ) : null}

        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Video: 2 columns on large screens */}
          <div className="lg:col-span-2">
            <Card>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-lg">Synced Video</h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Status: <span className="font-medium">{statusText}</span>
                  </p>
                </div>

                {isHost ? (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/mp4,video/webm,video/ogg"
                      className="hidden"
                      disabled={uploading}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) onPickVideo(f);
                        e.currentTarget.value = "";
                      }}
                    />

                    <Button
                      disabled={uploading}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {uploading ? "Uploading..." : "Upload Video"}
                    </Button>
                  </>
                ) : null}
              </div>

              <div className="mt-4">
                <SyncedVideoPlayer
                  src={src}
                  isHost={isHost}
                  playback={
                    room?.playback
                      ? {
                          isPlaying: room.playback.isPlaying,
                          currentTime: room.playback.currentTime,
                          updatedAt: room.playback.updatedAt,
                        }
                      : null
                  }
                  onHostPlay={async (t) => {
                    const ack = await play(roomId, t);
                    if (!ack.ok) setError(ack.message || "Play denied");
                  }}
                  onHostPause={async (t) => {
                    const ack = await pause(roomId, t);
                    if (!ack.ok) setError(ack.message || "Pause denied");
                  }}
                  onHostSeek={async (t) => {
                    const ack = await seek(roomId, t);
                    if (!ack.ok) setError(ack.message || "Seek denied");
                  }}
                  onHostStatePing={(t, playing) =>
                    statePing(roomId, t, playing)
                  }
                />
              </div>

              {!src ? (
                <p className="text-sm text-gray-600 mt-3">
                  {isHost
                    ? "Upload a video to start streaming."
                    : "Waiting for host to upload a video..."}
                </p>
              ) : (
                <p className="text-xs text-gray-500 mt-2">
                  {isHost
                    ? "Host controls playback for everyone."
                    : "Viewer mode: host controls playback. (Muted autoplay may require a click.)"}
                </p>
              )}
            </Card>
          </div>

          {/* Participants */}
          <div className="lg:col-span-1">
            <Card>
              <h2 className="font-semibold text-lg">Participants</h2>
              <p className="text-xs text-gray-500 mt-1">
                {room?.participants?.length || 0} online
              </p>

              <ul className="mt-4 space-y-2 text-sm">
                {room?.participants?.length ? (
                  room.participants.map((p) => (
                    <li
                      key={p.socketId}
                      className="flex items-center justify-between rounded-md border bg-gray-50 px-3 py-2"
                    >
                      <span className="truncate">{p.name}</span>
                      {room.hostSocketId === p.socketId ? (
                        <span className="text-xs px-2 py-1 rounded bg-black text-white">
                          Host
                        </span>
                      ) : null}
                    </li>
                  ))
                ) : (
                  <li className="text-gray-500">No participants yet</li>
                )}
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
