'use client';

import React, { useState, useTransition, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Upload,
  FolderInput,
  FileJson,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n/context';
import { siLetterboxd, siTrakt, siTvtime } from 'simple-icons';
import { exportUserData, importBatch } from '@/app/actions/data';
import type { ImportItem } from '@/app/actions/data';
import type { WatchStatus } from '@/types/tmdb';

type TranslationData = ReturnType<
  typeof useTranslation
>['t']['settings']['data'];
type CommonData = ReturnType<typeof useTranslation>['t']['common'];

function StepList({ steps }: { steps: readonly string[] }) {
  return (
    <ol className="space-y-1.5">
      {steps.map((step, i) => (
        <li key={i} className="flex items-start gap-2.5 text-xs text-muted">
          <span className="mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-surface-3 text-[10px] font-semibold text-text tabular-nums">
            {i + 1}
          </span>
          <span className="leading-relaxed">{step}</span>
        </li>
      ))}
    </ol>
  );
}

function PlatformInstructions({
  platform,
  td,
  tc,
}: {
  platform: Platform;
  td: TranslationData;
  tc: CommonData;
}) {
  if (platform !== 'tvtime') {
    const steps =
      platform === 'letterboxd' ? td.steps.letterboxd : td.steps.trakt;
    return (
      <div className="rounded-xl border border-border/20 bg-surface-2/20 p-4 space-y-3">
        <p className="text-xs font-semibold text-muted uppercase tracking-wider">
          {td.howToGet}
        </p>
        <StepList steps={steps} />
      </div>
    );
  }

  // TV Time — two methods
  return (
    <div className="rounded-xl border border-border/20 bg-surface-2/20 p-4 space-y-4">
      <p className="text-xs font-semibold text-muted uppercase tracking-wider">
        {td.howToGet}
      </p>

      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-text">
            {td.method.extension}
          </span>
          <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
            {td.method.recommended}
          </span>
          <span className="rounded-full bg-surface-3 px-2 py-0.5 text-[10px] text-muted">
            {td.method.instant}
          </span>
        </div>
        <StepList steps={td.steps.tvtimeExtension} />
      </div>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border/20" />
        <span className="text-[10px] uppercase tracking-wider text-muted/60">
          {tc.or}
        </span>
        <div className="h-px flex-1 bg-border/20" />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-text">
            {td.method.official}
          </span>
          <span className="rounded-full bg-surface-3 px-2 py-0.5 text-[10px] text-muted">
            {td.method.severalDays}
          </span>
        </div>
        <StepList steps={td.steps.tvtimeOfficial} />
      </div>
    </div>
  );
}

function BrandIcon({ path, color }: { path: string; color: string }) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      className="h-4 w-4 shrink-0"
      aria-hidden="true"
    >
      <path d={path} fill={`#${color}`} />
    </svg>
  );
}

const PLATFORMS: Array<{ id: Platform; label: string; logo: React.ReactNode }> =
  [
    {
      id: 'letterboxd',
      label: 'Letterboxd',
      logo: <BrandIcon path={siLetterboxd.path} color={siLetterboxd.hex} />,
    },
    {
      id: 'trakt',
      label: 'Trakt',
      logo: <BrandIcon path={siTrakt.path} color={siTrakt.hex} />,
    },
    {
      id: 'tvtime',
      label: 'TV Time',
      logo: <BrandIcon path={siTvtime.path} color={siTvtime.hex} />,
    },
  ];

type Platform = 'letterboxd' | 'trakt' | 'tvtime';

type ImportPhase =
  | { type: 'idle' }
  | { type: 'ready'; items: ImportItem[] }
  | { type: 'importing'; total: number; done: number }
  | { type: 'done'; imported: number; failed: string[] };

const BATCH_SIZE = 20;

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function parseLetterboxd(text: string): ImportItem[] {
  const lines = text.replace(/\r/g, '').split('\n').filter(Boolean);
  if (lines.length < 2) return [];
  const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase());
  const nameIdx = headers.indexOf('name');
  const yearIdx = headers.indexOf('year');
  const ratingIdx = headers.indexOf('rating');
  const watchedDateIdx = headers.indexOf('watched date');
  if (nameIdx === -1) return [];
  const isWatchlistCsv = watchedDateIdx === -1 && ratingIdx === -1;
  return lines.slice(1).flatMap((line) => {
    const cols = parseCSVLine(line);
    const title = cols[nameIdx]?.replace(/^"|"$/g, '') ?? '';
    if (!title) return [];
    const year = yearIdx !== -1 ? parseInt(cols[yearIdx] ?? '') || null : null;
    const rawRating =
      ratingIdx !== -1 ? parseFloat(cols[ratingIdx] ?? '') : NaN;
    const rating =
      !isNaN(rawRating) && rawRating > 0
        ? Math.min(10, Math.round(rawRating * 2))
        : null;
    return [
      {
        title,
        year,
        status: (isWatchlistCsv ? 'to_watch' : 'watched') as WatchStatus,
        rating,
        mediaType: 'movie' as const,
      },
    ];
  });
}

function parseTvTimeRefract(arr: unknown[]): ImportItem[] {
  const items: ImportItem[] = [];
  for (const entry of arr) {
    if (typeof entry !== 'object' || entry === null) continue;
    const e = entry as Record<string, unknown>;
    const title = e.title ? String(e.title).trim() : null;
    if (!title) continue;
    const year = typeof e.year === 'number' ? e.year : null;

    const ids = e.id as Record<string, unknown> | undefined;

    if (Array.isArray(e.seasons)) {
      const tvStatus = typeof e.status === 'string' ? e.status : '';
      const status: WatchStatus =
        tvStatus === 'up_to_date' ? 'watched' : 'to_watch';
      const tvdbId = typeof ids?.tvdb === 'number' ? ids.tvdb : null;
      const yearInTitle = title.match(/^(.+?)\s*\((\d{4})\)\s*$/);
      const cleanTitle = yearInTitle ? yearInTitle[1].trim() : title;
      const seriesYear = yearInTitle ? parseInt(yearInTitle[2]) : year;
      items.push({
        title: cleanTitle,
        year: seriesYear,
        status,
        mediaType: 'tv',
        tvdbId,
      });
    } else if ('is_watched' in e) {
      const status: WatchStatus =
        e.is_watched === true ? 'watched' : 'to_watch';
      const imdbId =
        typeof ids?.imdb === 'string' && ids.imdb ? ids.imdb : null;
      items.push({ title, year, status, mediaType: 'movie', imdbId });
    }
  }
  return items;
}

function parseTvTimeGDPR(obj: Record<string, unknown>): ImportItem[] {
  const objects = (obj.data as Record<string, unknown> | undefined)?.objects;
  if (!Array.isArray(objects)) return [];
  const seen = new Set<string>();
  const items: ImportItem[] = [];
  for (const entry of objects) {
    const e = entry as Record<string, unknown>;
    const meta = e.meta as Record<string, unknown> | undefined;
    const title = meta?.name ? String(meta.name).trim() : null;
    if (!title) continue;
    const key = title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const dateStr = meta?.first_release_date
      ? String(meta.first_release_date)
      : null;
    const year = dateStr ? parseInt(dateStr.slice(0, 4)) || null : null;
    items.push({
      title,
      year,
      status: 'watched' as WatchStatus,
      mediaType: 'tv' as const,
    });
  }
  return items;
}

function parseTvTimeJSON(obj: unknown): ImportItem[] {
  if (Array.isArray(obj)) return parseTvTimeRefract(obj);
  if (typeof obj === 'object' && obj !== null)
    return parseTvTimeGDPR(obj as Record<string, unknown>);
  return [];
}

function parseTvTimeCSV(text: string): ImportItem[] {
  const lines = text.replace(/\r/g, '').split('\n').filter(Boolean);
  if (lines.length < 2) return [];
  const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim());
  const seriesIdx = headers.findIndex(
    (h) =>
      h === 'name' ||
      h === 'show_name' ||
      h === 'series_name' ||
      h.includes('show') ||
      h.includes('series')
  );
  if (seriesIdx === -1) return [];
  const seen = new Set<string>();
  const items: ImportItem[] = [];
  for (const line of lines.slice(1)) {
    const cols = parseCSVLine(line);
    const title = cols[seriesIdx]?.replace(/^"|"$/g, '').trim() ?? '';
    if (!title) continue;
    const key = title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    items.push({
      title,
      year: null,
      status: 'watched' as WatchStatus,
      mediaType: 'tv' as const,
    });
  }
  return items;
}

function parseTrakt(parsed: unknown): ImportItem[] {
  if (!Array.isArray(parsed)) return [];
  const items: ImportItem[] = [];
  for (const entry of parsed) {
    if (typeof entry !== 'object' || entry === null) continue;
    const e = entry as Record<string, unknown>;
    // last_watched_at = watched history, listed_at only = watchlist
    const isWatched = 'last_watched_at' in e || 'watched_at' in e;
    const status: WatchStatus = isWatched ? 'watched' : 'to_watch';

    const movie = e.movie as Record<string, unknown> | undefined;
    if (movie) {
      const ids = movie.ids as Record<string, unknown> | undefined;
      if (typeof ids?.tmdb === 'number') {
        items.push({
          title: String(movie.title ?? ''),
          year: typeof movie.year === 'number' ? movie.year : null,
          status,
          tmdbId: ids.tmdb,
          mediaType: 'movie',
        });
        continue;
      }
    }

    const show = e.show as Record<string, unknown> | undefined;
    if (show) {
      const ids = show.ids as Record<string, unknown> | undefined;
      if (typeof ids?.tmdb === 'number') {
        items.push({
          title: String(show.title ?? ''),
          year: typeof show.year === 'number' ? show.year : null,
          status,
          tmdbId: ids.tmdb,
          mediaType: 'tv',
        });
      }
    }
  }
  return items;
}

async function parseFile(
  file: File,
  platform: Platform,
  unknownFormatMsg: string
): Promise<ImportItem[]> {
  const text = await file.text();
  if (platform === 'letterboxd') return parseLetterboxd(text);
  if (platform === 'tvtime') {
    try {
      return parseTvTimeJSON(JSON.parse(text));
    } catch {
      return parseTvTimeCSV(text);
    }
  }
  const obj = JSON.parse(text);
  if (platform === 'trakt') return parseTrakt(obj);
  throw new Error(unknownFormatMsg);
}

export function DataSettings() {
  const { t } = useTranslation();
  const td = t.settings.data;
  const [exportPending, startExportTransition] = useTransition();
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [phase, setPhase] = useState<ImportPhase>({ type: 'idle' });
  const [isDragOver, setIsDragOver] = useState(false);
  const [showFailed, setShowFailed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedExtension =
    platform === 'letterboxd'
      ? '.csv'
      : platform === 'tvtime'
        ? '.csv,.json'
        : '.json';

  function handleExport() {
    startExportTransition(async () => {
      try {
        const data = await exportUserData();
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reelmark-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success(td.exportSuccess);
      } catch {
        toast.error(t.common.actionError);
      }
    });
  }

  const handleFile = useCallback(
    async (file: File) => {
      if (!platform) return;
      try {
        const items = await parseFile(file, platform, td.importUnknownFormat);
        if (items.length === 0) throw new Error(td.importNoItems);
        setPhase({ type: 'ready', items });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t.common.actionError);
      }
    },
    [platform, td.importUnknownFormat, td.importNoItems, t.common.actionError]
  );

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  async function handleImport() {
    if (phase.type !== 'ready') return;
    const { items } = phase;
    const chunks: ImportItem[][] = [];
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      chunks.push(items.slice(i, i + BATCH_SIZE));
    }

    setPhase({ type: 'importing', total: items.length, done: 0 });

    let totalImported = 0;
    const allFailed: string[] = [];

    for (const chunk of chunks) {
      try {
        const result = await importBatch(chunk);
        totalImported += result.imported;
        allFailed.push(...result.failed);
      } catch {
        allFailed.push(...chunk.map((i) => i.title));
      }
      setPhase((prev) =>
        prev.type === 'importing'
          ? { ...prev, done: Math.min(prev.done + chunk.length, prev.total) }
          : prev
      );
    }

    setPhase({ type: 'done', imported: totalImported, failed: allFailed });
  }

  function handleReset() {
    setPhase({ type: 'idle' });
    setShowFailed(false);
    setPlatform(null);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{td.exportTitle}</CardTitle>
          <CardDescription>{td.exportDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleExport}
            disabled={exportPending}
            variant="outline"
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            {exportPending ? '...' : td.exportButton}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{td.importTitle}</CardTitle>
          <CardDescription>{td.importDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {phase.type !== 'done' && (
            <>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted uppercase tracking-wider">
                  {td.importSelectPlatform}
                </p>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setPlatform(p.id);
                        setPhase({ type: 'idle' });
                      }}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                        platform === p.id
                          ? 'bg-primary/20 border-primary/50 text-text'
                          : 'bg-surface-2/30 border-border/30 text-muted hover:border-border hover:text-text'
                      )}
                    >
                      {p.logo}
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {platform && (
                <PlatformInstructions
                  platform={platform}
                  td={td}
                  tc={t.common}
                />
              )}

              {platform && phase.type !== 'importing' && (
                <div className="space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={acceptedExtension}
                    className="sr-only"
                    onChange={handleFileInput}
                    tabIndex={-1}
                  />

                  {phase.type === 'idle' && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      onDrop={handleDrop}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragOver(true);
                      }}
                      onDragLeave={() => setIsDragOver(false)}
                      className={cn(
                        'w-full rounded-xl border-2 border-dashed p-8 flex flex-col items-center gap-3 transition-all cursor-pointer text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                        isDragOver
                          ? 'border-primary/60 bg-primary/5 text-text'
                          : 'border-border/30 hover:border-border hover:bg-surface-2/20 text-muted'
                      )}
                    >
                      <FolderInput className="h-8 w-8 opacity-50" />
                      <span className="text-sm font-medium">
                        {td.importDropzone}
                      </span>
                      <span className="text-xs">
                        {td.importDropzoneHint}
                        <span className="font-mono text-primary/80">
                          {td.importFormats[platform]}
                        </span>
                      </span>
                    </button>
                  )}

                  {phase.type === 'ready' && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-surface-2/30 border border-border/20">
                        <FileJson className="h-5 w-5 text-primary shrink-0" />
                        <span className="text-sm text-text font-medium">
                          {phase.items.length} {td.importFileReady}
                        </span>
                        <button
                          onClick={() => setPhase({ type: 'idle' })}
                          className="ml-auto text-xs text-muted hover:text-text transition-colors cursor-pointer"
                        >
                          {td.importCancel}
                        </button>
                      </div>
                      <Button onClick={handleImport} className="gap-2">
                        <FolderInput className="h-4 w-4" />
                        {td.importStartButton}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {phase.type === 'importing' && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-text">
                    {td.importing}
                  </p>
                  <div className="h-2 w-full rounded-full bg-surface-3 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-linear-to-r from-primary to-gold transition-all duration-(--duration-base)"
                      style={{
                        width: `${Math.round((phase.done / phase.total) * 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted tabular-nums">
                    {phase.done} / {phase.total}
                  </p>
                </div>
              )}
            </>
          )}

          {phase.type === 'done' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                <p className="text-sm font-semibold text-text">
                  {td.importDone}
                </p>
              </div>

              <div className="flex flex-wrap gap-4 text-sm">
                <span className="font-medium text-text">
                  {phase.imported}{' '}
                  <span className="text-muted font-normal">
                    {td.importedCount}
                  </span>
                </span>
                {phase.failed.length > 0 && (
                  <span className="font-medium text-text">
                    {phase.failed.length}{' '}
                    <span className="text-muted font-normal">
                      {td.failedCount}
                    </span>
                  </span>
                )}
              </div>

              {phase.failed.length > 0 && (
                <div className="space-y-2">
                  <button
                    onClick={() => setShowFailed((v) => !v)}
                    className="flex items-center gap-1.5 text-xs font-medium text-muted hover:text-text transition-colors cursor-pointer"
                  >
                    {showFailed ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                    {showFailed ? td.hideFailed : td.showFailed}
                  </button>
                  {showFailed && (
                    <div className="rounded-lg bg-surface-2/30 border border-border/20 p-3 max-h-40 overflow-y-auto space-y-1">
                      {phase.failed.map((title, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 text-xs text-muted"
                        >
                          <AlertCircle className="h-3 w-3 shrink-0 text-red/60" />
                          {title}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <Button variant="outline" size="sm" onClick={handleReset}>
                {td.importRestart}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
