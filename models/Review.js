const mongoose = require('mongoose')

const reviewSchema = new mongoose.Schema({

    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: true,
        trim: true,
        minLength: 1,
        maxLength: 200
    },
    venue: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Venue',
        required: true
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }

}, { timestamps: true })

const Review = mongoose.model('Review', reviewSchema)

module.exports = Review