const router = require('express').Router()
const Venue = require('../models/Venue')
const verifyToken = require('../middleware/verifyToken')
const authorize = require('../middleware/authorize')
const validateObjectId = require('../middleware/validateObjectId')
const Review = require('../models/Review')
const Booking = require('../models/Booking')
const BlockedDate = require('../models/Blocked-Date')

// Sends the right status code for common Mongoose errors
function handleError(res, err) {
    console.log(err)
    if (err.name === 'ValidationError') {
        return res.status(400).json({ message: err.message })
    }
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0]
        return res.status(409).json({ message: `${field} already exists` })
    }
    return res.status(500).json({ message: 'Internal Server Error' })
}

// Public: anyone can browse venues
router.get('/', async (req, res) => {
    try {
        const allVenues = await Venue.find()
        res.status(200).json(allVenues)
    } catch (err) {
        handleError(res, err)
    }
})

// Public: anyone can view one venue
router.get('/:id', validateObjectId, async (req, res) => {
    try {
        const oneVenue = await Venue.findById(req.params.id)
        const blockedDates = await Booking.find({venue: req.params.id})
        res.status(200).json(oneVenue, blockedDates)
    } catch (err) {
        handleError(res, err)
    }
})

// Owners only: create a venue
router.post('/', verifyToken, authorize('owner'), async (req, res) => {
    try {
        const { name, type, description, address, capacity, images, weekDayPrice, weekendPrice } = req.body
        const newVenue = await Venue.create({
            name: name,
            type: type,
            description: description,
            address: address,
            capacity: capacity,
            images: images,
            weekendPrice: weekendPrice,
            weekDayPrice: weekDayPrice,
            owner: req.user._id
        })
        res.status(201).json(newVenue)
    } catch (err) {
        handleError(res, err)
    }
})

// Owners only: edit their own venue
router.put('/:id', verifyToken, authorize('owner'), validateObjectId, async (req, res) => {
    try {
        const getVenueOwner = await Venue.findById(req.params.id)
        if (!getVenueOwner.owner || !getVenueOwner.owner.equals(req.user._id)) {
            return res.status(403).json({ message: 'You do not have permission to edit this venue.' })
        }

        // Only change the fields that were sent, so images and owner are never wiped
        const { name, type, description, address, capacity, images, weekDayPrice, weekendPrice } = req.body
        const updates = { name, type, description, address, capacity, images, weekDayPrice, weekendPrice }
        Object.keys(updates).forEach((key) => {
            if (updates[key] === undefined) delete updates[key]
        })

        const editedVenue = await Venue.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
        res.status(200).json(editedVenue)
    } catch (err) {
        handleError(res, err)
    }
})

// Owners only: delete their own venue
router.delete('/:id', verifyToken, authorize('owner'), validateObjectId, async (req, res) => {
    try {
        const getVenueOwner = await Venue.findById(req.params.id)

        if (!getVenueOwner.owner || !getVenueOwner.owner.equals(req.user._id)) {
            return res.status(403).json({ message: 'You do not have permission to delete this venue.' })
        }
        const deletedVenue = await Venue.findByIdAndDelete(req.params.id)
        res.status(200).json(deletedVenue)
    } catch (err) {
        handleError(res, err)
    }
})

// Logged in: book a venue on a date
router.post('/:id/booking', verifyToken, validateObjectId, async (req, res) => {
    try {
        const { date, notes } = req.body


        // Dates arrive from JSON as strings, so turn them into a Date at midnight
        const bookingDate = new Date(date)
        if (isNaN(bookingDate)) {
            return res.status(400).json({ message: 'Invalid date' })
        }
        bookingDate.setUTCHours(0, 0, 0, 0)

        const today = new Date()
        today.setUTCHours(0, 0, 0, 0)
        if (bookingDate < today) {
            return res.status(400).json({ message: 'You cannot book a date in the past' })
        }

        const getVenue = await Venue.findById(req.params.id)
        if (!getVenue) {
            return res.status(404).json({ message: 'Venue not found' })
        }

        // Is the date blocked by the owner?
        const blocked = await BlockedDate.findOne({ venue: req.params.id, date: bookingDate })
        if (blocked) {
            return res.status(409).json({ message: 'This date is not available' })
        }

        // Is the date already booked? (rejected and cancelled bookings don't count)
        const taken = await Booking.findOne({
            venue: req.params.id,
            date: bookingDate,
            status: { $in: ['pending', 'confirmed'] }
        })
        if (taken) {
            return res.status(409).json({ message: 'This date is already booked' })
        }

        // Sunday to Wednesday = weekday price, Thursday to Saturday = weekend price
        const day = bookingDate.getUTCDay()
        let price = null
        if (day >= 0 && day < 4) {
            price = getVenue.weekDayPrice
        } else {
            price = getVenue.weekendPrice
        }

        const newBooking = await Booking.create({
            venue: req.params.id,
            customer: req.user._id,
            date: bookingDate,
            totalPrice: price,
            notes: notes
        })

        res.status(201).json(newBooking)
    } catch (err) {
        // Two people booked the same date at the same moment: the database index stops the second one
        if (err.code === 11000) {
            return res.status(409).json({ message: 'This date is already booked' })
        }
        handleError(res, err)
    }
})

// Public: reviews for a venue
router.get('/:id/reviews', validateObjectId, async (req, res) => {
    try {
        const getReviews = await Review.find({ venue: req.params.id })
        res.status(200).json(getReviews)
    } catch (err) {
        handleError(res, err)
    }
})

module.exports = router
