export interface PaginationMeta {
  itemCount: number;
  totalItems: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Build a paginated response object
 */
export const buildPagination = <T>(
  data: T[],
  totalItems: number,
  page: number,
  limit: number,
): PaginatedResult<T> => {
  const totalPages = Math.ceil(totalItems / limit);

  return {
    data,
    meta: {
      itemCount: data.length,
      totalItems,
      itemsPerPage: limit,
      totalPages,
      currentPage: page,
    },
  };
};

/**
 * Calculate take and skip for Prisma pagination
 */
export const getPaginationParams = (page: number = 1, limit: number = 10) => {
  const take = Number(limit) || 10;
  const skip = (Number(page) - 1) * take || 0;
  return { take, skip };
};
