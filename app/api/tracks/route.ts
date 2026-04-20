import { NextResponse } from "next/server";
import { listSavedTracks, insertSavedTrack } from "@/lib/tracks";

export async function GET() {
  try {
    const tracks = await listSavedTracks();
    return NextResponse.json(tracks);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch tracks" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { title, artist, audio_url, cloudinary_public_id } = body;

    if (!audio_url) {
      return NextResponse.json(
        { error: "audio_url is required" },
        { status: 400 }
      );
    }

    const track = await insertSavedTrack({
      title: title ?? "Unknown Title",
      artist: artist ?? "Unknown Artist",
      audio_url,
      cloudinary_public_id: cloudinary_public_id ?? null,
    });

    return NextResponse.json(track);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to insert track" },
      { status: 500 }
    );
  }
}