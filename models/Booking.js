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

// The database refuses a second active booking for the same venue and date,
// even if two people press "Book" at the same moment.
// Rejected and cancelled bookings don't count, so the date frees up again.
bookingSchema.index(
    { venue: 1, date: 1 },
    { unique: true, partialFilterExpression: { status: { $in: ['pending', 'confirmed'] } } }
)

const Booking = mongoose.model('Booking', bookingSchema)

module.exports = Booking
