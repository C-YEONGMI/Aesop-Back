export const normalizePagination = (query = {}) => {
    const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    return {
        page,
        limit,
        skip,
    };
};

export const buildPaginationMeta = ({ page, limit, total }) => {
    const totalPages = total > 0 ? Math.ceil(total / limit) : 0;

    return {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page * limit < total,
    };
};
