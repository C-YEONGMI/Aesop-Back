import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        refreshTokenHash: {
            type: String,
            required: true,
            index: true,
        },
        userAgent: {
            type: String,
            default: '',
        },
        ipAddress: {
            type: String,
            default: '',
        },
        expiresAt: {
            type: Date,
            required: true,
            index: true,
        },
        lastUsedAt: {
            type: Date,
            default: Date.now,
        },
        revokedAt: {
            type: Date,
            default: null,
        },
        replacedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Session',
            default: null,
        },
        isRevoked: {
            type: Boolean,
            default: false,
            index: true,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

const Session = mongoose.model('Session', sessionSchema);

export default Session;
