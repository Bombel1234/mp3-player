import Mp3Player from "./components/mp3Player";
import { listSavedTracks } from "@/lib/tracks";

export default async function Home() {
  const tracks = await listSavedTracks().catch(() => []);

  return (
    <main className="relative flex h-screen items-center justify-center overflow-hidden bg-[#030712] ">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#1d4ed8_0%,transparent_28%),radial-gradient(circle_at_bottom,#be185d_0%,transparent_26%),linear-gradient(180deg,#020617_0%,#0f172a_100%)] opacity-60" />
      <Mp3Player tracks={tracks} />
      
    </main>
  );
}
