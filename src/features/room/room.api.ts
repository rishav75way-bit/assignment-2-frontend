import { api } from "../../lib/api";

export async function uploadVideo(file: File) {
  const form = new FormData();
  form.append("video", file);

  const res = await api.post("/api/videos/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data as {
    success: boolean;
    video: { id: string; originalName: string };
    streamUrl: string;
  };
}
