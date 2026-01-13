export type Participant = {
  socketId: string;
  name: string;
};

export type PlaybackState = {
  videoId: string | null;
  streamUrl: string | null;
  isPlaying: boolean;
  currentTime: number;
  updatedAt: number;
};

export type RoomState = {
  roomId: string;
  hostSocketId: string | null;
  participants: Participant[];
  playback: PlaybackState;
};
