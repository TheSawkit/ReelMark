'use client';

import React, { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
	AlertCircle,
	CheckCircle2,
	ChevronDown,
	ChevronUp,
	Copy,
	FileJson,
	FolderInput,
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
import { useWatchlistImport } from '@/hooks/useWatchlistImport';
import { countImportEntries } from '@/lib/data-transfer/batching';
import { parseImportFile, type Platform } from '@/lib/parsers/import-watchlist';
import {
	PLATFORMS,
	PlatformInstructions,
} from '@/components/settings/ImportPlatformInstructions';

const ACCEPTED_EXTENSIONS: Record<Platform, string> = {
	letterboxd: '.csv',
	tvtime: '.csv,.json',
	trakt: '.json',
};

export function ImportDataCard() {
	const { t } = useTranslation();
	const td = t.settings.data;
	const { phase, setReady, start, reset } = useWatchlistImport();
	const [platform, setPlatform] = useState<Platform | null>(null);
	const [isDragOver, setIsDragOver] = useState(false);
	const [showFailed, setShowFailed] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleFile = useCallback(
		async (file: File) => {
			if (!platform) return;
			try {
				const { items, lists } = await parseImportFile(
					file,
					platform,
					td.importUnknownFormat
				);
				if (countImportEntries(items, lists) === 0)
					throw new Error(td.importNoItems);
				setReady(items, lists);
			} catch (err) {
				toast.error(
					err instanceof Error ? err.message : t.common.actionError
				);
			}
		},
		[
			platform,
			setReady,
			td.importUnknownFormat,
			td.importNoItems,
			t.common.actionError,
		]
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

	function handleRestart() {
		reset();
		setShowFailed(false);
		setPlatform(null);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>{td.importTitle}</CardTitle>
				<CardDescription>{td.importDescription}</CardDescription>
			</CardHeader>
			<CardContent className="space-y-5">
				{phase.type !== 'done' && (
					<>
						<div className="space-y-2">
							<p className="eyebrow">{td.importSelectPlatform}</p>
							<div className="flex flex-wrap gap-2">
								{PLATFORMS.map((p) => (
									<button
										key={p.id}
										onClick={() => {
											setPlatform(p.id);
											reset();
										}}
										className={cn(
											'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
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
									accept={ACCEPTED_EXTENSIONS[platform]}
									className="sr-only"
									onChange={handleFileInput}
									tabIndex={-1}
								/>

								{phase.type === 'idle' && (
									<button
										onClick={() =>
											fileInputRef.current?.click()
										}
										onDrop={handleDrop}
										onDragOver={(e) => {
											e.preventDefault();
											setIsDragOver(true);
										}}
										onDragLeave={() => setIsDragOver(false)}
										className={cn(
											'w-full rounded-xl border-2 border-dashed p-8 flex flex-col items-center gap-3 transition cursor-pointer text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
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
												{countImportEntries(
													phase.items,
													phase.lists
												)}{' '}
												{td.importFileReady}
											</span>
											<button
												onClick={reset}
												className="ml-auto text-xs text-muted hover:text-text transition-colors cursor-pointer"
											>
												{td.importCancel}
											</button>
										</div>
										<Button
											onClick={() =>
												start(phase.items, phase.lists)
											}
											className="gap-2"
										>
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
										className="h-full rounded-full bg-linear-to-r from-primary to-gold transition-[width] duration-(--duration-base)"
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
								<div className="flex items-center gap-4">
									<button
										onClick={() => setShowFailed((v) => !v)}
										className="flex items-center gap-1.5 text-xs font-medium text-muted hover:text-text transition-colors cursor-pointer"
									>
										{showFailed ? (
											<ChevronUp className="h-3.5 w-3.5" />
										) : (
											<ChevronDown className="h-3.5 w-3.5" />
										)}
										{showFailed
											? td.hideFailed
											: td.showFailed}
									</button>
									<button
										onClick={async () => {
											await navigator.clipboard.writeText(
												phase.failed.join('\n')
											);
											toast.success(td.failedCopied);
										}}
										className="flex items-center gap-1.5 text-xs font-medium text-muted hover:text-text transition-colors cursor-pointer"
									>
										<Copy className="h-3.5 w-3.5" />
										{td.copyFailed}
									</button>
								</div>
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

						<Button
							variant="outline"
							size="sm"
							onClick={handleRestart}
						>
							{td.importRestart}
						</Button>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
