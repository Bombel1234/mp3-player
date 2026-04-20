// app/api/delete-all/route.ts

import { NextResponse } from "next/server";
import crypto from "crypto";

export async function DELETE() {
  const supabaseUrl = process.env.SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const table = process.env.SUPABASE_TRACKS_TABLE ?? "tracks";

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
  const apiKey = process.env.CLOUDINARY_API_KEY!;
  const apiSecret = process.env.CLOUDINARY_API_SECRET!;

  try {
    // 1. получаем все треки
    const res = await fetch(
      `${supabaseUrl}/rest/v1/${table}?select=cloudinary_public_id`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );

    const tracks = await res.json();

    // 2. удаляем каждый файл
    for (const track of tracks) {
      if (!track.cloudinary_public_id) continue;

      const timestamp = Math.floor(Date.now() / 1000);

      const signature = crypto
        .createHash("sha1")
        .update(
          `public_id=${track.cloudinary_public_id}&timestamp=${timestamp}${apiSecret}`
        )
        .digest("hex");

      const formData = new URLSearchParams();
      formData.append("public_id", track.cloudinary_public_id);
      formData.append("api_key", apiKey);
      formData.append("timestamp", timestamp.toString());
      formData.append("signature", signature);

      await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/video/destroy`,
        {
          method: "POST",
          body: formData,
        }
      );
    }

    // 3. очищаем базу
    await fetch(`${supabaseUrl}/rest/v1/${table}?id=not.is.null`, {
      method: "DELETE",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Delete all failed" }, { status: 500 });
  }
}