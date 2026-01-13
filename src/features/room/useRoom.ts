import { useEffect, useMemo, useState } from "react";
import { getSocket } from "./room.socket";
import type { RoomState } from "./room.types";

type JoinPayload = { roomId: string; name: string };

export function useRoom() {
  const socket = useMemo(() => getSocket(), []);
  const [room, setRoom] = useState<RoomState | null>(null);
  const [socketId, setSocketId] = useState<string | null>(null);

  useEffect(() => {
    const onConnect = () => {
      if (socket.id) setSocketId(socket.id);
    };
    const onRoomState = (state: RoomState) => setRoom(state);

    socket.on("connect", onConnect);
    socket.on("room:state", onRoomState);

    if (socket.connected && socket.id) setSocketId(socket.id);

    return () => {
      socket.off("connect", onConnect);
      socket.off("room:state", onRoomState);
    };
  }, [socket]);

  const joinRoom = (payload: JoinPayload) =>
    new Promise<{ ok: boolean; room?: RoomState; message?: string }>((resolve) => {
      const doJoin = () => {
        socket.emit("room:join", payload, (ack: any) => {
          if (ack?.ok && ack.room) setRoom(ack.room);
          resolve(ack);
        });
      };

      if (socket.connected) return doJoin();
      socket.once("connect", doJoin);
    });

  const claimHost = (roomId: string) =>
    new Promise<{ ok: boolean; reason?: string; message?: string }>((resolve) => {
      socket.emit("host:claim", { roomId }, (ack: any) => resolve(ack));
    });

  const leaveRoom = () =>
    new Promise<{ ok: boolean }>((resolve) => {
      socket.emit("room:leave", {}, (ack: any) => {
        setRoom(null);
        resolve(ack);
      });
    });

  // ✅ Host sets video for the room
  const setRoomVideo = (roomId: string, videoId: string, streamUrl: string) =>
    new Promise<{ ok: boolean; message?: string }>((resolve) => {
      socket.emit("room:video:set", { roomId, videoId, streamUrl }, (ack: any) => resolve(ack));
    });

  // ✅ Playback actions
  const play = (roomId: string, time: number) =>
    new Promise<{ ok: boolean; message?: string }>((resolve) => {
      socket.emit("player:play", { roomId, time, ts: Date.now() }, (ack: any) => resolve(ack));
    });

  const pause = (roomId: string, time: number) =>
    new Promise<{ ok: boolean; message?: string }>((resolve) => {
      socket.emit("player:pause", { roomId, time, ts: Date.now() }, (ack: any) => resolve(ack));
    });

  const seek = (roomId: string, time: number) =>
    new Promise<{ ok: boolean; message?: string }>((resolve) => {
      socket.emit("player:seek", { roomId, time, ts: Date.now() }, (ack: any) => resolve(ack));
    });

  const statePing = (roomId: string, time: number, playing: boolean) => {
    socket.emit("player:state", { roomId, time, playing, ts: Date.now() });
  };

  return {
    socket,
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
  };
}
