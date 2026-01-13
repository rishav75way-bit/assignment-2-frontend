import { createBrowserRouter } from "react-router-dom";
import JoinRoomPage from "../pages/JoinRoomPage";
import RoomPage from "../pages/RoomPage";

export const router = createBrowserRouter([
  { path: "/", element: <JoinRoomPage /> },
  { path: "/room/:roomId", element: <RoomPage /> },
]);
