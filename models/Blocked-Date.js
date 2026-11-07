const mongoose = require("mongoose")

const blockedDateSchema = new mongoose.Schema({
    venue: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Venue",
        required: true
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: true
    },
    reasonCategory: {
        type: String,
        enum: ['Maintenance', 'Holiday', 'Private Booking', 'Renovation', 'Other'],
        default: 'Other'
    },
    reason: {
        type: String,
        maxlength: 255,
        trim: true
    }

}, { timestamps: true })

// Index to make date-range queries efficient for a specific venue
blockedDateSchema.index({ venue: 1, startTime: 1, endTime: 1 });

// Pre-save hook to ensure logical date ordering
blockedDateSchema.pre('save', function (next) {
    if (this.startTime >= this.endTime) {
        return next(new Error('startTime must be strictly before endTime.'));
    }
    next();
});
const BlockedDate = mongoose.model('BlockedDate', blockedDateSchema)

module.exports = BlockedDate