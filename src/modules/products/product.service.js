import mongoose from 'mongoose';
import Product from './product.model.js';
import AppError from '../../utils/AppError.js';
import { buildPaginationMeta, normalizePagination } from '../../utils/pagination.js';

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const SORT_OPTIONS = {
    newest: { newestId: -1, _id: -1 },
    popular: { popularId: 1, _id: -1 },
    price_asc: { primaryPrice: 1, _id: -1 },
    price_desc: { primaryPrice: -1, _id: -1 },
    name_asc: { name: 1, _id: -1 },
    name_desc: { name: -1, _id: -1 },
};

const buildProductFilters = ({ category, q }) => {
    const filters = {};

    if (category) {
        filters.$or = [
            { categorySlug: category.toLowerCase() },
            { category: category },
        ];
    }

    if (q) {
        const searchRegex = new RegExp(escapeRegex(q), 'i');

        filters.$and = [
            ...(filters.$and || []),
            {
                $or: [
                    { name: searchRegex },
                    { description: searchRegex },
                    { searchText: searchRegex },
                ],
            },
        ];
    }

    return filters;
};

const serializeProduct = (product) => ({
    id: String(product._id),
    newestId: product.newestId,
    popularId: product.popularId,
    category: product.category,
    categorySlug: product.categorySlug,
    name: product.name,
    slug: product.slug,
    description: product.description,
    badge: product.badges,
    status: product.isActive,
    classifications: product.classifications,
    variants: product.variants,
    primaryPrice: product.primaryPrice,
    primaryImage: product.primaryImage,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
});

export const listProducts = async (query = {}) => {
    const { page, limit, skip } = normalizePagination(query);
    const filters = buildProductFilters(query);
    const sort = SORT_OPTIONS[query.sort] || SORT_OPTIONS.newest;

    const [items, total] = await Promise.all([
        Product.find(filters)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean(),
        Product.countDocuments(filters),
    ]);

    return {
        items: items.map(serializeProduct),
        ...buildPaginationMeta({ page, limit, total }),
    };
};

export const getProductById = async (identifier) => {
    const query = mongoose.isValidObjectId(identifier)
        ? { _id: identifier }
        : {
              $or: [
                  { slug: String(identifier).toLowerCase() },
                  { sourceId: String(identifier) },
              ],
          };

    const product = await Product.findOne(query).lean();

    if (!product) {
        throw new AppError('Product could not be found.', 404, {
            code: 'PRODUCT_NOT_FOUND',
        });
    }

    return serializeProduct(product);
};
