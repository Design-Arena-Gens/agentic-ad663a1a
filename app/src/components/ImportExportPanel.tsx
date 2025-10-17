'use client';

import { ChangeEvent, useCallback, useRef, useState } from 'react';
import Image from 'next/image';
import { useDeckContext } from '@/context/DeckContext';
import { parseCsv, parsePlainOrMarkdown, ImportedCard } from '@/lib/importers';

interface ImportExportPanelProps {
  deckId: string;
}

interface VideoExtractionResult {
  image?: string;
  audio?: string;
  filename: string;
}

type FFmpegInstance = {
  load: () => Promise<void>;
  FS: (method: string, ...args: unknown[]) => unknown;
  run: (...args: string[]) => Promise<void>;
};

type FFmpegModule = {
  ffmpeg: FFmpegInstance;
  fetchFile: (input: File | string | URL | ArrayBuffer | Uint8Array) => Promise<Uint8Array>;
};

function bytesToBase64(bytes: Uint8Array, mime: string) {
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return `data:${mime};base64,${btoa(binary)}`;
}

function detectMime(filename: string) {
  if (filename.endsWith('.png')) return 'image/png';
  if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) return 'image/jpeg';
  if (filename.endsWith('.webp')) return 'image/webp';
  if (filename.endsWith('.mp3')) return 'audio/mpeg';
  if (filename.endsWith('.wav')) return 'audio/wav';
  if (filename.endsWith('.ogg')) return 'audio/ogg';
  return 'application/octet-stream';
}

export function ImportExportPanel({ deckId }: ImportExportPanelProps) {
  const { cards, bulkAddCards } = useDeckContext();
  const [status, setStatus] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [videoResult, setVideoResult] = useState<VideoExtractionResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const ffmpegRef = useRef<FFmpegModule | null>(null);

  const handleImportCards = useCallback(
    (items: ImportedCard[]) => {
      if (!items.length) {
        setStatus('No cards detected in the file.');
        return;
      }
      bulkAddCards(
        items.map((item) => ({
          deckId,
          front: item.front,
          back: item.back,
          image: item.image,
          audio: item.audio,
        })),
      );
      setStatus(`Imported ${items.length} card${items.length > 1 ? 's' : ''} successfully.`);
    },
    [bulkAddCards, deckId],
  );

  const handleFileSelection = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const extension = file.name.split('.').pop()?.toLowerCase();
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = typeof reader.result === 'string' ? reader.result : new TextDecoder().decode(reader.result as ArrayBuffer);
        if (extension === 'csv') {
          handleImportCards(parseCsv(text));
        } else {
          handleImportCards(parsePlainOrMarkdown(text));
        }
      } catch (error) {
        console.error(error);
        setStatus('Failed to parse file. Please check the format and try again.');
      } finally {
        event.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const exportAsCsv = () => {
    const deckCards = cards.filter((card) => card.deckId === deckId);
    if (!deckCards.length) {
      setStatus('No cards to export.');
      return;
    }
    const headers = ['front', 'back', 'image', 'audio'] as const;
    const rows = deckCards.map((card) => {
      const fields: Record<(typeof headers)[number], string | undefined> = {
        front: card.front,
        back: card.back,
        image: card.image,
        audio: card.audio,
      };
      return headers
        .map((column) => {
          const value = fields[column] ?? '';
          return `"${value.replace(/"/g, '""')}"`;
        })
        .join(',');
    });
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'deck-export.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setStatus(`Exported ${deckCards.length} card${deckCards.length > 1 ? 's' : ''} to CSV.`);
  };

  const loadFfmpeg = useCallback(async (): Promise<FFmpegModule> => {
    if (ffmpegRef.current) return ffmpegRef.current;
    const ffmpegModule = (await import('@ffmpeg/ffmpeg')) as unknown as {
      createFFmpeg: (options: Record<string, unknown>) => unknown;
      fetchFile: FFmpegModule['fetchFile'];
    };
    const ffmpeg = ffmpegModule.createFFmpeg({
      log: false,
      corePath: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/ffmpeg-core.js',
    }) as unknown as FFmpegInstance;
    await ffmpeg.load();
    ffmpegRef.current = {
      ffmpeg,
      fetchFile: ffmpegModule.fetchFile,
    };
    return ffmpegRef.current;
  }, []);

  const processVideo = async (file: File) => {
    setIsProcessing(true);
    setStatus('Extracting media from video…');
    try {
      const { ffmpeg, fetchFile } = await loadFfmpeg();
      const safeName = `input-${Date.now()}.${file.name.split('.').pop()}`;
      ffmpeg.FS('writeFile', safeName, await fetchFile(file));

      const stillName = 'thumbnail.png';
      let audioName = 'audio.mp3';

      await ffmpeg.run('-i', safeName, '-ss', '00:00:01.000', '-frames:v', '1', stillName);
      try {
        await ffmpeg.run('-i', safeName, '-vn', '-acodec', 'libmp3lame', '-q:a', '4', audioName);
      } catch {
        audioName = 'audio.wav';
        await ffmpeg.run('-i', safeName, '-vn', '-acodec', 'pcm_s16le', '-ar', '44100', audioName);
      }

      const stillData = ffmpeg.FS('readFile', stillName) as Uint8Array;
      const audioData = ffmpeg.FS('readFile', audioName) as Uint8Array;

      ffmpeg.FS('unlink', safeName);
      ffmpeg.FS('unlink', stillName);
      ffmpeg.FS('unlink', audioName);

      const image = bytesToBase64(stillData, detectMime(stillName));
      const audio = bytesToBase64(audioData, detectMime(audioName));

      setVideoResult({ image, audio, filename: file.name });
      setStatus('Video processed. Preview the extracted media below.');
    } catch (error) {
      console.error(error);
      setStatus('Could not process the video. Please try a different file.');
    } finally {
      setIsProcessing(false);
      if (videoInputRef.current) {
        videoInputRef.current.value = '';
      }
    }
  };

  const handleVideoSelection = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['video/mp4', 'video/webm'].includes(file.type)) {
      setStatus('Unsupported video format. Please use MP4 or WebM.');
      return;
    }
    processVideo(file);
  };

  const handleVideoDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      processVideo(file);
    }
  };

  const createCardFromVideo = () => {
    if (!videoResult) return;
    handleImportCards([
      {
        front: `<p>Extracted still from <strong>${videoResult.filename}</strong></p><img src="${videoResult.image ?? ''}" alt="Video still" />${
          videoResult.audio
            ? `<p><audio controls src="${videoResult.audio}">Audio playback not supported.</audio></p>`
            : ''
        }`,
        back: '',
        image: videoResult.image,
        audio: videoResult.audio,
      },
    ]);
    setVideoResult(null);
  };

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow">
      <header className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-slate-800">Import &amp; Export</h3>
        <p className="text-sm text-slate-600">
          Upload TXT, Markdown, or CSV files to import cards. Drag videos here to extract images and audio.
        </p>
      </header>
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
          >
            Import cards
          </button>
          <button
            type="button"
            onClick={exportAsCsv}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500"
          >
            Export deck as CSV
          </button>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          accept=".txt,.md,.markdown,.csv"
          className="hidden"
          onChange={handleFileSelection}
        />
      </div>

      <div
        className="flex min-h-[150px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-sm text-slate-600 transition hover:border-sky-400 hover:bg-sky-50"
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleVideoDrop}
      >
        <p className="font-medium text-slate-700">Drag &amp; drop video (MP4/WebM) here</p>
        <p className="text-xs text-slate-500">We&apos;ll extract a thumbnail and audio snippet for you.</p>
        <button
          type="button"
          className="mt-3 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
          onClick={() => videoInputRef.current?.click()}
        >
          Select video file
        </button>
        <input
          ref={videoInputRef}
          type="file"
          accept="video/mp4,video/webm"
          className="hidden"
          onChange={handleVideoSelection}
        />
        {isProcessing ? (
          <p className="mt-3 text-xs font-medium text-sky-600">Processing video… this may take a moment.</p>
        ) : null}
      </div>

      {videoResult ? (
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <h4 className="text-sm font-semibold text-slate-700">Extracted media</h4>
          {videoResult.image ? (
            <Image
              src={videoResult.image}
              alt="Extracted still frame"
              width={640}
              height={360}
              className="h-40 w-full rounded-lg object-cover"
              unoptimized
            />
          ) : null}
          {videoResult.audio ? (
            <audio controls className="w-full">
              <source src={videoResult.audio} />
              Your browser does not support audio playback.
            </audio>
          ) : null}
          <button
            type="button"
            className="self-start rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
            onClick={createCardFromVideo}
          >
            Create card from extracted media
          </button>
        </div>
      ) : null}

      {status ? (
        <p className="text-xs font-medium text-slate-600" role="status">
          {status}
        </p>
      ) : null}
    </section>
  );
}
