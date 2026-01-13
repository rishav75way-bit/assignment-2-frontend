import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";

export default function JoinRoomPage() {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState("room1");
  const [name, setName] = useState("User");

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card>
        <h1 className="text-xl font-semibold">Join a Room</h1>
        <p className="text-sm text-gray-600 mt-1">
          Enter your name and a room id to join.
        </p>

        <div className="mt-4 space-y-3">
          <div>
            <label className="text-sm font-medium">Room ID</label>
            <Input value={roomId} onChange={(e) => setRoomId(e.target.value)} />
          </div>

          <div>
            <label className="text-sm font-medium">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <Button
            className="w-full"
            onClick={() => navigate(`/room/${encodeURIComponent(roomId)}?name=${encodeURIComponent(name)}`)}
          >
            Join
          </Button>
        </div>
      </Card>
    </div>
  );
}
