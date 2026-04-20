// app/api/delete-track/route.ts

import { NextResponse } from "next/server";
import crypto from "crypto";

export async function DELETE(req: Request) {
  const { id, public_id } = await req.json();

  const supabaseUrl = process.env.SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const table = process.env.SUPABASE_TRACKS_TABLE ?? "tracks";

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME!;
  const apiKey = process.env.CLOUDINARY_API_KEY!;
  const apiSecret = process.env.CLOUDINARY_API_SECRET!;

  try {
    // 1. Удаляем из Cloudinary
    if (public_id) {
      const timestamp = Math.floor(Date.now() / 1000);

      const signature = crypto
        .createHash("sha1")
        .update(`public_id=${public_id}&timestamp=${timestamp}${apiSecret}`)
        .digest("hex");

      const formData = new URLSearchParams();
      formData.append("public_id", public_id);
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

    // 2. Удаляем из Supabase
    await fetch(`${supabaseUrl}/rest/v1/${table}?id=eq.${id}`, {
      method: "DELETE",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}