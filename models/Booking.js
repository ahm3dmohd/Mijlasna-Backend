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
        type: Boolean,
        default: false
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