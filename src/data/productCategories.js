export const PRODUCT_CATEGORY_GROUPS = [
    {
        slug: 'skincare',
        label: 'SKIN CARE',
        aliases: ['Skin Care', 'SKIN CARE'],
    },
    {
        slug: 'fragrance',
        label: 'PERFUME',
        aliases: ['Fragrance', 'Perfume', 'PERFUME'],
    },
    {
        slug: 'home',
        label: 'HOME · LIVING',
        aliases: ['Home', 'Home · Living', 'HOME · LIVING'],
    },
    {
        slug: 'hair',
        label: 'HAIR · SHAVING',
        aliases: ['Hair', 'Hair · Shaving', 'HAIR · SHAVING'],
    },
    {
        slug: 'body',
        label: 'HAND · BODY',
        aliases: ['Body', 'Body · Hand', 'Hand · Body', 'HAND · BODY'],
    },
    {
        slug: 'kits',
        label: 'KITS',
        aliases: ['Gifts', 'Travel', 'Kits', 'KITS'],
    },
];

export const PRODUCT_CATEGORY_CONFIG = Object.fromEntries(
    PRODUCT_CATEGORY_GROUPS.map((category) => [category.slug, category])
);

export const normalizeCategoryValue = (value = '') =>
    value.toLowerCase().replace(/[^a-z]/g, '');

export const formatCategoryLabel = (value = '') => {
    const matchedCategory = getProductCategoryConfig(value);

    if (matchedCategory) {
        return matchedCategory.label;
    }

    return normalizeCategoryValue(value) === 'perfume' ? value.toUpperCase() : value;
};

export const getProductCategoryConfig = (value = '') => {
    const normalizedValue = normalizeCategoryValue(value);

    return PRODUCT_CATEGORY_GROUPS.find((category) =>
        [category.slug, category.label, ...category.aliases].some(
            (candidate) => normalizeCategoryValue(candidate) === normalizedValue
        )
    );
};

export const getCategoryLabelFromValue = (value = '') =>
    formatCategoryLabel(getProductCategoryConfig(value)?.label || value);

export const getCategorySlugFromValue = (value = '') =>
    getProductCategoryConfig(value)?.slug || '';

export const getCategoryRouteFromValue = (value = '') => {
    const slug = getCategorySlugFromValue(value);
    return slug ? `/products/${slug}` : '/products';
};

export const extractProductCodeFromImage = (imageUrl = '') => {
    const matches =
        imageUrl.match(/\/images\/products\/([^/]+)/) ||
        imageUrl.match(/\/images\/skin-care-kits\/([^/]+)/);

    return matches?.[1] || '';
};

const hasCategoryKeyword = (name = '', keywords = []) =>
    keywords.some((keyword) => name.includes(keyword));

const HOME_FRAGRANCE_KEYWORDS = ['룸 스프레이', 'Room Spray', '포스트-푸', 'Post-Poo'];
const HAIR_SKIN_KEYWORDS = [
    '셰이빙',
    'Shaving',
    '브러시',
    'Brush',
    '블레이드',
    'Blade',
    '스테인리스 스틸 볼',
    'Stainless Steel Bowl',
];

export const inferProductCategoryLabel = (product = {}) => {
    const fallbackCategory = getCategoryLabelFromValue(product.category);
    const code = extractProductCodeFromImage(product.variants?.[0]?.image || '');
    const prefix = code.replace(/[0-9].*$/, '');
    const name = product.name || '';

    if (prefix === 'APB') {
        return formatCategoryLabel(PRODUCT_CATEGORY_CONFIG.kits.label);
    }

    if (prefix === 'HR' || prefix === 'ASH') {
        return formatCategoryLabel(PRODUCT_CATEGORY_CONFIG.hair.label);
    }

    if (['BM', 'BT', 'BS', 'VL'].includes(prefix)) {
        return formatCategoryLabel(PRODUCT_CATEGORY_CONFIG.body.label);
    }

    if (['HM', 'AHM', 'BB'].includes(prefix)) {
        return formatCategoryLabel(PRODUCT_CATEGORY_CONFIG.home.label);
    }

    if (prefix === 'FR') {
        if (hasCategoryKeyword(name, HOME_FRAGRANCE_KEYWORDS)) {
            return formatCategoryLabel(PRODUCT_CATEGORY_CONFIG.home.label);
        }

        return formatCategoryLabel(PRODUCT_CATEGORY_CONFIG.fragrance.label);
    }

    if (prefix === 'SK') {
        if (hasCategoryKeyword(name, HAIR_SKIN_KEYWORDS)) {
            return formatCategoryLabel(PRODUCT_CATEGORY_CONFIG.hair.label);
        }

        return formatCategoryLabel(PRODUCT_CATEGORY_CONFIG.skincare.label);
    }

    return fallbackCategory;
};
