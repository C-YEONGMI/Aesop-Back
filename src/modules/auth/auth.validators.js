import AppError from '../../utils/AppError.js';

const assertString = (value, field) => {
    if (typeof value !== 'string' || value.trim() === '') {
        throw new AppError(`${field} is required.`, 400, {
            code: 'VALIDATION_ERROR',
            details: { field },
        });
    }
};

export const validateLoginPayload = (body = {}) => {
    assertString(body.identifier, 'identifier');
    assertString(body.password, 'password');

    return {
        identifier: body.identifier.trim(),
        password: body.password,
    };
};

export const validateRefreshPayload = (body = {}) => ({
    refreshToken: typeof body.refreshToken === 'string' ? body.refreshToken.trim() : '',
});

export const validateProductListQuery = (query = {}) => ({
    page: query.page,
    limit: query.limit,
    category: typeof query.category === 'string' ? query.category.trim() : '',
    q: typeof query.q === 'string' ? query.q.trim() : '',
    sort: typeof query.sort === 'string' ? query.sort.trim() : '',
});
