import mongoose from 'mongoose';

const classificationSchema = new mongoose.Schema(
    {
        category: { type: String, trim: true, default: '' },
        subcategory: { type: String, trim: true, default: '' },
    },
    { _id: false }
);

const variantSchema = new mongoose.Schema(
    {
        capacity: { type: String, trim: true, default: '' },
        price: { type: Number, required: true, min: 0 },
        image: { type: String, trim: true, default: '' },
    },
    { _id: false }
);

const productSchema = new mongoose.Schema(
    {
        sourceId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        newestId: { type: Number, default: 0, index: true },
        popularId: { type: Number, default: 0, index: true },
        category: { type: String, required: true, trim: true, index: true },
        categorySlug: { type: String, required: true, trim: true, lowercase: true, index: true },
        name: { type: String, required: true, trim: true },
        slug: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
        description: { type: String, default: '' },
        badges: { type: [String], default: [] },
        isActive: { type: Boolean, default: true, index: true },
        classifications: { type: [classificationSchema], default: [] },
        variants: { type: [variantSchema], default: [] },
        primaryPrice: { type: Number, default: 0, index: true },
        primaryImage: { type: String, default: '' },
        searchText: { type: String, default: '' },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

productSchema.index({ searchText: 'text', name: 'text', description: 'text' });

const Product = mongoose.model('Product', productSchema);

export default Product;
