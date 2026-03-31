const normalizeKey = (value = '') => String(value || '').trim().toLowerCase();

export const slugifyProductValue = (value = '') =>
    String(value)
        .normalize('NFKD')
        .replace(/[^\w\s-]/g, '')
        .trim()
        .toLowerCase()
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '') || `product-${Date.now()}`;

const normalizeVariants = (variants = []) =>
    (Array.isArray(variants) ? variants : []).map((variant) => ({
        capacity: variant.capacity || '',
        price: Number(variant.price) || 0,
        image: variant.image || '',
    }));

const normalizeClassifications = (classifications = []) =>
    (Array.isArray(classifications) ? classifications : []).map((classification) => ({
        category: classification.category || '',
        subcategory: classification.subcategory || '',
    }));

const buildMetadataMap = (existingProducts = []) => {
    const metadataMap = new Map();

    for (const product of existingProducts) {
        const key = normalizeKey(product.name);
        if (!key || metadataMap.has(key)) {
            continue;
        }

        metadataMap.set(key, {
            sourceId: product.sourceId,
            newestId: product.newestId,
            popularId: product.popularId,
            category: product.category,
            categorySlug: product.categorySlug,
            slug: product.slug,
            badges: Array.isArray(product.badges)
                ? product.badges
                : Array.isArray(product.badge)
                  ? product.badge
                  : [],
            isActive:
                typeof product.isActive === 'boolean'
                    ? product.isActive
                    : typeof product.status === 'boolean'
                      ? product.status
                      : true,
            classifications: normalizeClassifications(product.classifications),
        });
    }

    return metadataMap;
};

const buildSearchText = ({ category, name, description, classifications }) =>
    [
        category || '',
        name || '',
        description || '',
        ...(classifications || []).flatMap((classification) => [
            classification.category,
            classification.subcategory,
        ]),
    ]
        .join(' ')
        .trim();

export const normalizeProductsForDatabase = (sourceProducts = [], options = {}) => {
    const { existingProducts = [] } = options;
    const rawProducts = Array.isArray(sourceProducts)
        ? sourceProducts
        : Array.isArray(sourceProducts?.products)
          ? sourceProducts.products
          : [];
    const metadataMap = buildMetadataMap(existingProducts);

    return rawProducts.map((product, index) => {
        const name = product.name?.trim() || `Product ${index + 1}`;
        const metadata = metadataMap.get(normalizeKey(name)) || {};
        const variants = normalizeVariants(product.variants);
        const classifications =
            metadata.classifications?.length > 0
                ? metadata.classifications
                : normalizeClassifications(product.classifications);
        const category = product.category || metadata.category || 'UNCATEGORIZED';
        const sourceId = String(metadata.sourceId || slugifyProductValue(name));
        const slug = String(metadata.slug || slugifyProductValue(name));
        const newestId = Number(metadata.newestId ?? product.newestId ?? index + 1) || index + 1;
        const popularId =
            Number(metadata.popularId ?? product.popularId ?? index + 1) || index + 1;
        const badges =
            metadata.badges ??
            (Array.isArray(product.badges)
                ? product.badges
                : Array.isArray(product.badge)
                  ? product.badge
                  : []);
        const isActive =
            typeof metadata.isActive === 'boolean'
                ? metadata.isActive
                : typeof product.status === 'boolean'
                  ? product.status
                  : true;

        return {
            sourceId,
            newestId,
            popularId,
            category,
            categorySlug: metadata.categorySlug || slugifyProductValue(category || 'uncategorized'),
            name,
            slug,
            description: product.description || '',
            badges,
            isActive,
            classifications,
            variants,
            primaryPrice: variants[0]?.price || 0,
            primaryImage: variants[0]?.image || '',
            searchText: buildSearchText({
                category,
                name,
                description: product.description || '',
                classifications,
            }),
        };
    });
};

export const normalizeProductsForSnapshot = (sourceProducts = [], options = {}) => {
    const { existingProducts = [] } = options;
    const rawProducts = Array.isArray(sourceProducts)
        ? sourceProducts
        : Array.isArray(sourceProducts?.products)
          ? sourceProducts.products
          : [];
    const metadataMap = buildMetadataMap(existingProducts);

    return rawProducts.map((product, index) => {
        const name = product.name?.trim() || `Product ${index + 1}`;
        const metadata = metadataMap.get(normalizeKey(name)) || {};

        return {
            newestId: Number(metadata.newestId ?? product.newestId ?? index + 1) || index + 1,
            category: product.category || metadata.category || 'UNCATEGORIZED',
            name,
            description: product.description || '',
            variants: normalizeVariants(product.variants),
            badge:
                metadata.badges ??
                (Array.isArray(product.badges)
                    ? product.badges
                    : Array.isArray(product.badge)
                      ? product.badge
                      : []),
            status:
                typeof metadata.isActive === 'boolean'
                    ? metadata.isActive
                    : typeof product.status === 'boolean'
                      ? product.status
                      : true,
            popularId:
                Number(metadata.popularId ?? product.popularId ?? index + 1) || index + 1,
            classifications:
                metadata.classifications?.length > 0
                    ? metadata.classifications
                    : normalizeClassifications(product.classifications),
        };
    });
};
