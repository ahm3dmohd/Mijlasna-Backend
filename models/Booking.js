const mongoose = require('mongoose')

const bookingSchema = new mongoose.Schema({
    venue: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Venue',
        required: true
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    timeOfDay: {
        type: String,
        required: true,
        enum: ['Morning 7 to 12', 'Evening 7 to 12']
    },
    totalPrice: {
        type: Number,
        required: true
    },
    deposit: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'rejected', 'cancelled', 'completed'],
        default: 'pending'
    },
    paymentStatus: {
        type: Boolean,
        default: false
    },
    notes: {
        type: String,
        trim: true
    }
}, { timestamps: true })

const Booking = mongoose.model('Booking', bookingSchema)

module.exports = Booking
