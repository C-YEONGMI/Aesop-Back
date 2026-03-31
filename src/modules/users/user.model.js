import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema(
    {
        label: { type: String, trim: true },
        recipient: { type: String, trim: true },
        phone: { type: String, trim: true },
        postcode: { type: String, trim: true },
        address1: { type: String, trim: true },
        address2: { type: String, trim: true },
        isDefault: { type: Boolean, default: false },
    },
    { _id: false }
);

const userSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            unique: true,
            index: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            unique: true,
            index: true,
        },
        passwordHash: {
            type: String,
            required: true,
        },
        phone: {
            type: String,
            trim: true,
            default: '',
        },
        gender: {
            type: String,
            enum: ['', 'female', 'male'],
            default: '',
        },
        birthDate: {
            type: String,
            default: '',
        },
        authMethod: {
            type: String,
            enum: ['password', 'social'],
            default: 'password',
        },
        socialProvider: {
            type: String,
            default: '',
        },
        socialId: {
            type: String,
            default: '',
        },
        avatarUrl: {
            type: String,
            default: '',
        },
        addresses: {
            type: [addressSchema],
            default: [],
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

userSchema.index({ socialProvider: 1, socialId: 1 }, { unique: true, sparse: true });

const User = mongoose.model('User', userSchema);

export default User;
