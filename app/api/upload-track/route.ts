import { revalidatePath } from "next/cache";
import { getCloudinary } from "@/lib/cloudinary";
import { insertSavedTrack, isTrackStorageReady, parseTrackName } from "@/lib/tracks";

function isMp3File(file: File) {
  return (
    file.type === "audio/mpeg" ||
    file.type === "audio/mp3" ||
    file.name.toLowerCase().endsWith(".mp3")
  );
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  if (error && typeof error === "object") {
    try {
      return JSON.stringify(error);
    } catch {
      return "Unknown object error";
    }
  }

  return "Upload failed unexpectedly.";
}

export async function POST(request: Request) {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return Response.json(
        { error: "Cloudinary credentials are not configured." },
        { status: 500 },
      );
    }

    if (!isTrackStorageReady()) {
      return Response.json(
        { error: "Supabase credentials are not configured." },
        { status: 500 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return Response.json({ error: "MP3 file is required." }, { status: 400 });
    }

    if (!isMp3File(file)) {
      return Response.json({ error: "Only MP3 files are supported." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const base64File = Buffer.from(bytes).toString("base64");
    const parsed = parseTrackName(file.name);
    const cloudinary = getCloudinary();

    const uploadResult = await cloudinary.uploader.upload(
      `data:${file.type || "audio/mpeg"};base64,${base64File}`,
      {
        folder: process.env.CLOUDINARY_UPLOAD_FOLDER ?? "mp3-player/tracks",
        public_id: file.name.replace(/\.mp3$/i, "").replace(/[^\w-]+/g, "-").toLowerCase(),
        resource_type: "video",
        overwrite: false,
      },
    );

    const track = await insertSavedTrack({
      title: parsed.title,
      artist: parsed.artist,
      audio_url: uploadResult.secure_url,
      cloudinary_public_id: uploadResult.public_id ?? null,
    });

    revalidatePath("/");
    revalidatePath("/loadFiles");

    return Response.json({ track }, { status: 201 });
  } catch (error) {
    return Response.json(
      {
        error: getErrorMessage(error),
      },
      { status: 500 },
    );
  }
}
