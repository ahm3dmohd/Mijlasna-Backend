const mongoose = require('mongoose')
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

// Admin can manage every venue, an owner only their own
function canManageVenue(venue, user) {
    if (user.role === 'admin') return true
    return venue.owner && venue.owner.equals(user._id)
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
        if (!oneVenue) {
            return res.status(404).json({ message: 'Venue not found' })
        }
        res.status(200).json(oneVenue)
    } catch (err) {
        handleError(res, err)
    }
})

// Owners and admin: create a venue
// An admin can pass "owner" in the body to create a venue for an owner
router.post('/', verifyToken, authorize('owner', 'admin'), async (req, res) => {
    try {
        const { name, type, description, address, capacity, images, weekDayPrice, weekendPrice } = req.body
        const owner = req.user.role === 'admin' && req.body.owner ? req.body.owner : req.user._id
        const newVenue = await Venue.create({
            name: name,
            type: type,
            description: description,
            address: address,
            capacity: capacity,
            images: images,
            weekendPrice: weekendPrice,
            weekDayPrice: weekDayPrice,
            owner: owner
        })
        res.status(201).json(newVenue)
    } catch (err) {
        handleError(res, err)
    }
})

// Owner edits their own venue, admin edits any venue
router.put('/:id', verifyToken, authorize('owner', 'admin'), validateObjectId, async (req, res) => {
    try {
        const getVenueOwner = await Venue.findById(req.params.id)
        if (!getVenueOwner) {
            return res.status(404).json({ message: 'Venue not found' })
        }
        if (!canManageVenue(getVenueOwner, req.user)) {
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

// Owner deletes their own venue, admin deletes any venue
router.delete('/:id', verifyToken, authorize('owner', 'admin'), validateObjectId, async (req, res) => {
    try {
        const getVenueOwner = await Venue.findById(req.params.id)
        if (!getVenueOwner) {
            return res.status(404).json({ message: 'Venue not found' })
        }

        if (!canManageVenue(getVenueOwner, req.user)) {
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
        const { date, timeOfDay, notes } = req.body


        // Dates arrive from JSON as strings, so turn them into a Date at midnight
        const rawDate = new Date(date);
        const bookingDate = new Date(Date.UTC(
            rawDate.getUTCFullYear(),
            rawDate.getUTCMonth(),
            rawDate.getUTCDate()
        ));

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
        const blocked = await BlockedDate.findOne({ venue: req.params.id, date: bookingDate, timeOfDay: timeOfDay })
        if (blocked) {
            return res.status(409).json({ message: 'This date is not available' })
        }

        // Is the date already booked? (rejected and cancelled bookings don't count)
        const taken = await Booking.findOne({
            venue: req.params.id,
            date: bookingDate,
            timeOfDay: timeOfDay,
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
            timeOfDay: timeOfDay,
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

// Logged in: write a review for a venue
router.post('/:id/reviews', verifyToken, validateObjectId, async (req, res) => {
    try {
        const venue = await Venue.findById(req.params.id)
        if (!venue) {
            return res.status(404).json({ message: 'Venue not found' })
        }

        const { rating, comment } = req.body
        const newReview = await Review.create({
            rating: rating,
            comment: comment,
            venue: req.params.id,
            customer: req.user._id
        })
        res.status(201).json(newReview)
    } catch (err) {
        handleError(res, err)
    }
})

// The review's author, the venue owner or an admin: delete a review
router.delete('/:id/reviews/:rid', verifyToken, validateObjectId, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.rid)) {
            return res.status(404).json({ message: 'Invalid id' })
        }

        const getVenueOwner = await Venue.findById(req.params.id)
        if (!getVenueOwner) {
            return res.status(404).json({ message: 'Venue not found' })
        }

        const getReview = await Review.findOne({ _id: req.params.rid, venue: req.params.id })
        if (!getReview) {
            return res.status(404).json({ message: 'Review not found' })
        }

        const isAuthor = getReview.customer.equals(req.user._id)
        if (!isAuthor && !canManageVenue(getVenueOwner, req.user)) {
            return res.status(403).json({ message: 'You do not have permission to delete this review.' })
        }

        const deletedReview = await Review.findByIdAndDelete(req.params.rid)
        res.status(200).json(deletedReview)
    } catch (err) {
        handleError(res, err)
    }
})

// ---------- Blocked dates ----------

// Turns a date string into a Date at midnight (UTC), or null if invalid
function toDay(date) {
    const day = new Date(date)
    if (!date || isNaN(day)) return null
    day.setUTCHours(0, 0, 0, 0)
    return day
}

// Public: blocked dates for a venue
router.get('/:id/blocked-dates', validateObjectId, async (req, res) => {
    try {
        const blockedDates = await BlockedDate.find({ venue: req.params.id }).sort({ date: 1 })
        res.status(200).json(blockedDates)
    } catch (err) {
        handleError(res, err)
    }
})

// Venue owner or admin: block a date
router.post('/:id/blocked-dates', verifyToken, authorize('owner', 'admin'), validateObjectId, async (req, res) => {
    try {
        const venue = await Venue.findById(req.params.id)
        if (!venue) {
            return res.status(404).json({ message: 'Venue not found' })
        }
        if (!canManageVenue(venue, req.user)) {
            return res.status(403).json({ message: 'You cannot block dates on this venue.' })
        }

        const { date, timeOfDay, reasonCategory, reason } = req.body
        const day = toDay(date)
        if (!day) {
            return res.status(400).json({ message: 'Invalid date' })
        }

        const rawDate = new Date(req.body.date);
        const blockedDate = new Date(Date.UTC(
            rawDate.getUTCFullYear(),
            rawDate.getUTCMonth(),
            rawDate.getUTCDate()
        ));

        const today = new Date()
        today.setUTCHours(0, 0, 0, 0)
        if (blockedDate < today) {
            return res.status(400).json({ message: 'You cannot block a date in the past' })
        }

        const alreadyBlocked = await BlockedDate.findOne({
            venue: req.params.id,
            date: blockedDate,
            timeOfDay: timeOfDay,
        })
        if (alreadyBlocked) {
            return res.status(409).json({ message: 'This date is already blocked' })
        }

        const newBlockedDate = await BlockedDate.create({
            venue: req.params.id,
            date: blockedDate,
            timeOfDay: timeOfDay,
            reasonCategory: reasonCategory,
            reason: reason
        })
        res.status(201).json(newBlockedDate)
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ message: 'This date is already blocked' })
        }
        handleError(res, err)
    }
})

// Venue owner or admin: edit a blocked date
router.put('/:id/blocked-dates/:blockedId', verifyToken, authorize('owner', 'admin'), validateObjectId, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.blockedId)) {
            return res.status(404).json({ message: 'Invalid id' })
        }

        const venue = await Venue.findById(req.params.id)
        if (!venue) {
            return res.status(404).json({ message: 'Venue not found' })
        }

        if (!canManageVenue(venue, req.user)) {
            return res.status(403).json({ message: 'You cannot edit blocked dates on this venue.' })
        }

        const { date, timeOfDay, reasonCategory, reason } = req.body
        const updates = { date, timeOfDay, reasonCategory, reason }

        // If a date is provided, normalize it and check if it's in the past
        if (date !== undefined) {
            const rawDate = new Date(date)
            if (isNaN(rawDate.getTime())) {
                return res.status(400).json({ message: 'Invalid date format' })
            }

            const normalizedDate = new Date(Date.UTC(
                rawDate.getUTCFullYear(),
                rawDate.getUTCMonth(),
                rawDate.getUTCDate()
            ))

            const today = new Date()
            today.setUTCHours(0, 0, 0, 0)

            if (normalizedDate < today) {
                return res.status(400).json({ message: 'You cannot block a date in the past' })
            }

            updates.date = normalizedDate
        }

        // If either date or timeOfDay is being updated, check for conflicts (excluding current record)
        if (date !== undefined || timeOfDay !== undefined) {
            // Find the existing record to fallback if only one of them is provided in req.body
            const existingBlock = await BlockedDate.findById(req.params.blockedId)
            if (!existingBlock) {
                return res.status(404).json({ message: 'Blocked date not found' })
            }

            const targetDate = updates.date || existingBlock.date
            const targetTime = timeOfDay !== undefined ? timeOfDay : existingBlock.timeOfDay

            const alreadyBlocked = await BlockedDate.findOne({
                _id: { $ne: req.params.blockedId }, // EXCLUDE current record so it doesn't conflict with itself
                venue: req.params.id,
                date: targetDate,
                timeOfDay: targetTime,
            })

            if (alreadyBlocked) {
                return res.status(409).json({ message: 'This date and time slot is already blocked' })
            }
        }

        // Clean up undefined fields so we only update what was sent
        Object.keys(updates).forEach((key) => {
            if (updates[key] === undefined) delete updates[key]
        })

        const editedBlockedDate = await BlockedDate.findOneAndUpdate(
            { _id: req.params.blockedId, venue: req.params.id },
            updates,
            { new: true, runValidators: true }
        )

        if (!editedBlockedDate) {
            return res.status(404).json({ message: 'Blocked date not found' })
        }

        res.status(200).json(editedBlockedDate)
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ message: 'This date is already blocked' })
        }
        handleError(res, err)
    }
})

// Venue owner or admin: unblock a date
router.delete('/:id/blocked-dates/:blockedId', verifyToken, authorize('owner', 'admin'), validateObjectId, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.blockedId)) {
            return res.status(404).json({ message: 'Invalid id' })
        }
        const venue = await Venue.findById(req.params.id)
        if (!venue) {
            return res.status(404).json({ message: 'Venue not found' })
        }
        if (!canManageVenue(venue, req.user)) {
            return res.status(403).json({ message: 'You cannot delete blocked dates on this venue.' })
        }

        const deletedBlockedDate = await BlockedDate.findOneAndDelete({ _id: req.params.blockedId, venue: req.params.id })
        if (!deletedBlockedDate) {
            return res.status(404).json({ message: 'Blocked date not found' })
        }
        res.status(200).json(deletedBlockedDate)
    } catch (err) {
        handleError(res, err)
    }
})

module.exports = router
