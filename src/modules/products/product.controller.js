import asyncHandler from '../../utils/asyncHandler.js';
import pick from '../../utils/pick.js';
import { validateProductListQuery } from '../auth/auth.validators.js';
import { getProductById, listProducts } from './product.service.js';

export const list = asyncHandler(async (req, res) => {
    const query = validateProductListQuery(
        pick(req.query, ['page', 'limit', 'category', 'q', 'sort'])
    );
    const result = await listProducts(query);

    res.status(200).json(result);
});

export const detail = asyncHandler(async (req, res) => {
    const product = await getProductById(req.params.id);

    res.status(200).json(product);
});
