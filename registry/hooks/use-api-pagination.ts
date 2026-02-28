"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

interface BackendPagination {
	total: number;
	currentPage: number;
	limit: number;
	totalPages?: number;
}

interface ApiResponse<T> {
	data: T[];
	pagination: BackendPagination;
}

interface UseAdminPaginationProps<T> {
	fetchFunction: (params: {
		page: number;
		limit: number;
	}) => Promise<ApiResponse<T>>;
	defaultLimit?: number;
}

export function useAdminPagination<T>({
	fetchFunction,
	defaultLimit = 10,
}: UseAdminPaginationProps<T>) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const urlPage = Number(searchParams.get("page")) || 1;
	const urlLimit = Number(searchParams.get("limit")) || defaultLimit;

	const [data, setData] = useState<T[]>([]);
	const [pagination, setPagination] = useState<BackendPagination>({
		total: 0,
		currentPage: urlPage,
		limit: urlLimit,
		totalPages: 1,
	});

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const updateUrl = (page: number, limit: number) => {
		const params = new URLSearchParams(searchParams.toString());
		params.set("page", String(page));
		params.set("limit", String(limit));
		router.push(`${pathname}?${params.toString()}`);
	};

	const fetchData = async (page: number, limit: number) => {
		try {
			setLoading(true);
			setError(null);

			updateUrl(page, limit);

			const response = await fetchFunction({ page, limit });

			setData(response.data);
			setPagination({
				...response.pagination,
				totalPages:
					response.pagination.totalPages ??
					Math.ceil(response.pagination.total / response.pagination.limit),
			});
		} catch (err: any) {
			setError(err.message || "Something went wrong");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchData(urlPage, urlLimit);
	}, []);

	const goToPage = (page: number) => {
		fetchData(page, pagination.limit);
	};

	const nextPage = () => {
		if (pagination.currentPage < pagination.totalPages!) {
			fetchData(pagination.currentPage + 1, pagination.limit);
		}
	};

	const prevPage = () => {
		if (pagination.currentPage > 1) {
			fetchData(pagination.currentPage - 1, pagination.limit);
		}
	};

	const changeLimit = (newLimit: number) => {
		fetchData(1, newLimit);
	};

	return {
		data,
		pagination,
		loading,
		error,
		goToPage,
		nextPage,
		prevPage,
		changeLimit,
		refetch: () => fetchData(pagination.currentPage, pagination.limit),
	};
}
