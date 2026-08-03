'use client';

import React, { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import {
	Upload,
	FolderInput,
	FileJson,
	CheckCircle2,
	AlertCircle,
	ChevronDown,
	ChevronUp,
	Copy,
	FileText,
	ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { useGuardedTransition } from '@/hooks/useGuardedTransition';
import { createInFlightGuard } from '@/lib/in-flight-guard';
import { localizedHref } from '@/lib/i18n/utils';
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
import { exportUserData, importBatch, importLists } from '@/app/actions/data';
import { RATE_LIMITED } from '@/lib/action-errors';
import type { ImportItem, ImportedList } from '@/lib/data-transfer/types';
import { parseImportFile, type Platform } from '@/lib/parsers/import-watchlist';
import {
	PLATFORMS,
	PlatformInstructions,
} from '@/components/settings/ImportPlatformInstructions';

type ImportPhase =
	| { type: 'idle' }
	| { type: 'ready'; items: ImportItem[]; lists: ImportedList[] }
	| { type: 'importing'; total: number; done: number }
	| { type: 'done'; imported: number; failed: string[] };

function countImportEntries(items: ImportItem[], lists: ImportedList[]) {
	return (
		items.length + lists.reduce((sum, list) => sum + list.items.length, 0)
	);
}

const BATCH_SIZE = 20;
const EPISODES_PER_BATCH = 1500;

function chunkImportItems(items: ImportItem[]): ImportItem[][] {
	const chunks: ImportItem[][] = [];
	let current: ImportItem[] = [];
	let currentEpisodes = 0;
	for (const item of items) {
		const episodeCount = item.watchedEpisodes?.length ?? 0;
		const overflows =
			current.length >= BATCH_SIZE ||
			(current.length > 0 &&
				currentEpisodes + episodeCount > EPISODES_PER_BATCH);
		if (overflows) {
			chunks.push(current);
			current = [];
			currentEpisodes = 0;
		}
		current.push(item);
		currentEpisodes += episodeCount;
	}
	if (current.length > 0) chunks.push(current);
	return chunks;
}

export function DataSettings() {
	const { t, lang } = useTranslation();
	const td = t.settings.data;
	const legal = t.pages.legal;
	const [exportPending, startExportTransition] = useGuardedTransition();
	const [platform, setPlatform] = useState<Platform | null>(null);
	const [phase, setPhase] = useState<ImportPhase>({ type: 'idle' });
	const [isDragOver, setIsDragOver] = useState(false);
	const [showFailed, setShowFailed] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const importGuardRef = useRef<ReturnType<typeof createInFlightGuard>>(null);
	importGuardRef.current ??= createInFlightGuard();
	const importGuard = importGuardRef.current;

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
			} catch (err) {
				const msg = err instanceof Error ? err.message : '';
				toast.error(
					msg === RATE_LIMITED
						? td.exportRateLimited
						: t.common.actionError
				);
			}
		});
	}

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
				setPhase({ type: 'ready', items, lists });
			} catch (err) {
				toast.error(
					err instanceof Error ? err.message : t.common.actionError
				);
			}
		},
		[
			platform,
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

	async function handleImport() {
		if (phase.type !== 'ready' || importGuard.busy) return;
		await importGuard.run(runImport);
	}

	async function runImport() {
		if (phase.type !== 'ready') return;
		const { items, lists } = phase;
		const chunks = chunkImportItems(items);
		const total = countImportEntries(items, lists);

		setPhase({ type: 'importing', total, done: 0 });

		let totalImported = 0;
		const allFailed: string[] = [];

		const advance = (count: number) =>
			setPhase((prev) =>
				prev.type === 'importing'
					? {
							...prev,
							done: Math.min(prev.done + count, prev.total),
						}
					: prev
			);

		for (const chunk of chunks) {
			try {
				const result = await importBatch(chunk);
				totalImported += result.imported;
				allFailed.push(...result.failed);
			} catch {
				allFailed.push(...chunk.map((i) => i.title));
			}
			advance(chunk.length);
		}

		for (const list of lists) {
			try {
				const result = await importLists([list]);
				totalImported += result.imported;
				allFailed.push(...result.failed);
			} catch {
				allFailed.push(...list.items.map((i) => i.title));
			}
			advance(list.items.length);
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
					<CardTitle>{td.legalTitle}</CardTitle>
					<CardDescription>{td.legalDescription}</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-wrap gap-2">
					<Button asChild variant="outline" className="gap-2">
						<Link href={localizedHref(lang, '/terms')}>
							<FileText className="h-4 w-4" />
							{legal.terms.title}
						</Link>
					</Button>
					<Button asChild variant="outline" className="gap-2">
						<Link href={localizedHref(lang, '/privacy')}>
							<ShieldCheck className="h-4 w-4" />
							{legal.privacy.title}
						</Link>
					</Button>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>{td.exportTitle}</CardTitle>
					<CardDescription>{td.exportDescription}</CardDescription>
				</CardHeader>
				<CardContent>
					<Button
						onClick={handleExport}
						loading={exportPending}
						variant="outline"
						className="gap-2"
					>
						<Upload className="h-4 w-4" />
						{td.exportButton}
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
								<p className="eyebrow">
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
										accept={acceptedExtension}
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
											onDragLeave={() =>
												setIsDragOver(false)
											}
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
													onClick={() =>
														setPhase({
															type: 'idle',
														})
													}
													className="ml-auto text-xs text-muted hover:text-text transition-colors cursor-pointer"
												>
													{td.importCancel}
												</button>
											</div>
											<Button
												onClick={handleImport}
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
											onClick={() =>
												setShowFailed((v) => !v)
											}
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
								onClick={handleReset}
							>
								{td.importRestart}
							</Button>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
