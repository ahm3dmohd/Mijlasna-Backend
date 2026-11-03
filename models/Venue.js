const mongoose = require('mongoose')

const venueSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,
        unique: true,
        trim: true        
    },
    type: {
        type: String,
        required: true,
        enum: ['Mijlas', 'Diwaniya', 'Hall', 'Pool House']
    },
    description: {
        type: String,
        maxLength: 1000
    },
    address: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    capacity: {
        type: Number,
        required: true,
        max: 1000
    },
    images: {
        type: String,
        required:true
    },
    weekendPrice: {
        type: Number,
        required: true
    },
    weekDayPrice: {
        type: Number,
        required: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }

}, { timestamps: true })

const Venue = mongoose.model('Venue', venueSchema)

module.exports = Venue