const PAGE_SIZE = 1000;

/**
 * Fetches every row of a Supabase query by paginating past PostgREST's 1000-row response cap.
 * The query must have a stable unique ordering for ranges to be consistent across pages.
 */
export async function fetchAllRows<T>(
	buildPage: (
		from: number,
		to: number
	) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>
): Promise<T[]> {
	const rows: T[] = [];
	for (let from = 0; ; from += PAGE_SIZE) {
		const { data, error } = await buildPage(from, from + PAGE_SIZE - 1);
		if (error) throw new Error(error.message);
		rows.push(...(data ?? []));
		if (!data || data.length < PAGE_SIZE) break;
	}
	return rows;
}
