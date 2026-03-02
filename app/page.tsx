
import fs from 'fs';
import path from 'path';
import Image from 'next/image';
import Player from './components/AudioPlayer';

const audioDirectory = path.join(process.cwd(), 'public/audio');
let songs: string[] = [];
try {
  // 2. Читаем файлы из папки
  const filenames = fs.readdirSync(audioDirectory);

  // 3. Фильтруем только аудиофайлы (mp3, wav и т.д.)
  songs = filenames.filter((file) =>
    /\.(mp3|wav|ogg|m4a)$/i.test(file)
  );
  console.log(songs)
} catch (error) {
  console.error("Папка public/audio не найдена:", error);
}

export default function Home() {
  return (
    <div className="p-4 min-h-screen ">
      <Player 
        listMusic={songs}
      />
    </div>

  );
}
