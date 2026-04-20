export type SavedTrack = {
  id: string;
  title: string;
  artist: string;
  audio_url: string;
  cloudinary_public_id: string | null;
  created_at: string;
};

type InsertTrackInput = {
  title: string;
  artist: string;
  audio_url: string;
  cloudinary_public_id: string | null;
};

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const table = process.env.SUPABASE_TRACKS_TABLE ?? "tracks";

  return {
    table,
    url,
    serviceRoleKey,
    ready: Boolean(url && serviceRoleKey),
  };
}

function normalizeTrackName(fileName: string) {
  const cleanName = fileName
    .replace(/\.mp3$/i, "")
    .replace(/_New$/i, "")
    .replace(/_/g, " ")
    .trim();

  if (cleanName.includes(" - ")) {
    const [artist, ...titleParts] = cleanName.split(" - ");
    return {
      artist: artist.trim(),
      title: titleParts.join(" - ").trim(),
    };
  }

  const chunks = cleanName.split("-");

  if (chunks.length > 1) {
    return {
      artist: chunks[0].trim(),
      title: chunks.slice(1).join(" - ").trim(),
    };
  }

  return {
    artist: "Unknown Artist",
    title: cleanName,
  };
}

export function parseTrackName(fileName: string) {
  return normalizeTrackName(fileName);
}

export function isTrackStorageReady() {
  return getSupabaseConfig().ready;
}

export async function listSavedTracks(): Promise<SavedTrack[]> {
  const config = getSupabaseConfig();

  if (!config.ready || !config.url || !config.serviceRoleKey) {
    return [];
  }

  const response = await fetch(
    `${config.url}/rest/v1/${config.table}?select=id,title,artist,audio_url,cloudinary_public_id,created_at&order=created_at.desc`,
    {
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`Supabase fetch failed with status ${response.status}`);
  }

  return (await response.json()) as SavedTrack[];
}

export async function insertSavedTrack(input: InsertTrackInput): Promise<SavedTrack> {
  const config = getSupabaseConfig();

  if (!config.ready || !config.url || !config.serviceRoleKey) {
    throw new Error("Supabase credentials are not configured.");
  }

  const response = await fetch(`${config.url}/rest/v1/${config.table}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Prefer: "return=representation",
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
    },
    body: JSON.stringify(input),
    cache: "no-store",
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Supabase insert failed: ${details}`);
  }

  const [track] = (await response.json()) as SavedTrack[];

  return track;
}
