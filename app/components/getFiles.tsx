'use client';

import { LoaderCircle, Music4, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { ChangeEvent, useMemo, useRef, useState } from "react";
import Link from "next/link";

type UploadResult = {
  title: string;
  artist: string;
  audio_url: string;
};

const acceptedAudioTypes = ["audio/mpeg", "audio/mp3"];

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function isMp3File(file: File) {
  return (
    acceptedAudioTypes.includes(file.type) ||
    file.name.toLowerCase().endsWith(".mp3")
  );
}

export default function GetFiles() {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedTracks, setUploadedTracks] = useState<UploadResult[]>([]);

  const totalSize = useMemo(
    () => files.reduce((sum, file) => sum + file.size, 0),
    [files],
  );

  function addFiles(fileList: FileList | null) {
    if (!fileList?.length) {
      return;
    }

    const nextFiles = Array.from(fileList);
    const invalidFiles = nextFiles.filter((file) => !isMp3File(file));

    if (invalidFiles.length > 0) {
      setError("Можно выбирать только MP3-файлы.");
      return;
    }

    setError("");
    setFiles((current) => {
      const deduped = nextFiles.filter(
        (file) =>
          !current.some(
            (currentFile) =>
              currentFile.name === file.name &&
              currentFile.size === file.size &&
              currentFile.lastModified === file.lastModified,
          ),
      );

      return [...current, ...deduped];
    });
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    addFiles(event.target.files);
    event.target.value = "";
  }

  async function handleUpload() {
    if (files.length === 0) {
      setError("Сначала выбери хотя бы один MP3-файл.");
      return;
    }

    setIsUploading(true);
    setError("");

    try {
      const results: UploadResult[] = [];

      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/upload-track", {
          method: "POST",
          body: formData,
        });

        const responseText = await response.text();
        const payload = (responseText ? JSON.parse(responseText) : {}) as {
          error?: string;
          track?: UploadResult;
        };

        if (!response.ok || !payload.track) {
          throw new Error(payload.error ?? "Не удалось загрузить файл.");
        }

        results.push(payload.track);
      }

      setUploadedTracks(results);
      setFiles([]);
      router.refresh();
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Во время загрузки произошла ошибка.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section className="w-full max-w-3xl rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_20px_80px_-40px_rgba(15,23,42,0.45)] backdrop-blur xl:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3 py-4">
          <div className="flex justify-between">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
              <Music4 className="h-3.5 w-3.5" />
              Cloud Upload
            </span>
            <Link
              href='/'
              className="rounded-full bg-emerald-100 text-black py-2 px-4"
            >Powrot do player
            </Link>
          </div>


          {/* <div> */}


          <h2 className="text-2xl font-semibold text-slate-900">
            Загрузка MP3 в Cloudinary
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Выбери MP3-файлы, компонент отправит их в Cloudinary, сохранит
            ссылки в Supabase, а затем `page.tsx` сможет получить эти URL с
            сервера.
          </p>
          {/* </div> */}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            <Upload className="h-4 w-4" />
            Выбрать файлы
          </button>

          <button
            type="button"
            onClick={handleUpload}
            disabled={isUploading}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-300"
          >
            {isUploading ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {isUploading ? "Загрузка..." : "Загрузить"}
          </button>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".mp3,audio/mpeg"
        multiple
        onChange={handleInputChange}
        className="sr-only"
      />

      <div className="mt-6 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50/80 p-6">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Выбранные файлы
          </h3>
          <p className="text-sm text-slate-500">
            {files.length} шт. / {formatFileSize(totalSize)}
          </p>
        </div>

        {files.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            Пока ничего не выбрано.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {files.map((file) => (
              <li
                key={`${file.name}-${file.lastModified}-${file.size}`}
                className="flex items-center justify-between gap-3 rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">
                    {file.name}
                  </p>
                  <p className="text-sm text-slate-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error ? (
        <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {uploadedTracks.length > 0 ? (
        <div className="mt-6 rounded-[1.5rem] border border-emerald-100 bg-emerald-50 p-5">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Загружено
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-emerald-950">
            {uploadedTracks.map((track) => (
              <li key={track.audio_url}>
                {track.artist} - {track.title}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
