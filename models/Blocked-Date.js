const mongoose = require("mongoose")

const blockedDateSchema = new mongoose.Schema({
    venue: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Venue",
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    timeOfDay:{
        type: String,
        required:true,
        enum: ['Morning 7 to 12','Evening 7 to 12']
    },
    reasonCategory: {
        type: String,
        enum: ['Maintenance', 'Holiday', 'Private Booking', 'Renovation', 'Other'],
        default: 'Private Booking'
    },
    reason: {
        type: String,
        maxlength: 255,
        trim: true
    }

}, { timestamps: true })

const BlockedDate = mongoose.model('BlockedDate', blockedDateSchema)

module.exports = BlockedDate