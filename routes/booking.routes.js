const router = require("express").Router()
const verifyToken = require("../middleware/verifyToken")
const authorize = require("../middleware/authorize")
const validateObjectId = require("../middleware/validateObjectId")
const Booking = require("../models/Booking")
const Venue = require("../models/Venue")
const BlockedDate = require('../models/Blocked-Date')
router.use(verifyToken)


function canView(booking, user) {
    if (user.role === "admin") return true
    if (booking.customer._id.equals(user._id)) return true
    return booking.venue && booking.venue.owner && booking.venue.owner.equals(user._id)
}


router.get("/", async (req, res) => {
    try {
        let allBookings = null
        if (req.user.role === "admin") {
            allBookings = await Booking.find()
                .populate("venue")
                .populate("customer")
        } else {
            allBookings = await Booking.find({ customer: req.user._id })
                .populate("venue")
                .populate("customer")
        }
        res.status(200).json(allBookings)
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: "Internal Server Error" })
    }
})


router.get("/owner", authorize("owner"), async (req, res) => {
    try {
        const myVenues = await Venue.find({ owner: req.user._id }).select("_id")
        const bookings = await Booking.find({ venue: { $in: myVenues } })
            .sort({ date: 1 })
            .populate("venue")
            .populate("customer")
        res.status(200).json(bookings)
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: "Internal Server Error" })
    }
})


router.get("/:id", validateObjectId, async (req, res) => {
    try {
        const foundBooking = await Booking.findById(req.params.id)
            .populate("venue")
            .populate("customer")

        if (!foundBooking) {
            return res.status(404).json({ message: "Booking not found" })
        }

        if (!canView(foundBooking, req.user)) {
            return res.status(403).json({ message: "You cannot view this booking" })
        }
        res.status(200).json(foundBooking)
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: "Internal Server Error" })
    }
})


router.post("/:id/checkout", validateObjectId, async (req, res) => {
    try {
        const foundBooking = await Booking.findById(req.params.id)

        if (!foundBooking) {
            return res.status(404).json({ message: "Booking not found" })
        }

        if (!foundBooking.customer.equals(req.user._id)) {
            return res.status(403).json({ message: "You cannot pay for this booking" })
        }

        const checkout = await Booking.findByIdAndUpdate(
            req.params.id,
            { deposit: true },
            { new: true }
        )
        res.status(200).json(checkout)
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: "Internal Server Error" })
    }
})


router.put("/:id/status", validateObjectId, async (req, res) => {
    try {
        const { status } = req.body
        const foundBooking = await Booking.findById(req.params.id).populate("venue")

        if (!foundBooking) {
            return res.status(404).json({ message: "Booking not found" })
        }

        const isOwner = foundBooking.venue && foundBooking.venue.owner && foundBooking.venue.owner.equals(req.user._id)
        const isCustomer = foundBooking.customer.equals(req.user._id)

        const ownerCanSet = ["confirmed", "rejected", "completed"]
        const customerCanSet = ["cancelled"]

        const adminCanSet = ["pending", "confirmed", "rejected", "cancelled", "completed"]

        if (req.user.role === "admin" && adminCanSet.includes(status)) {
            foundBooking.status = status
        } else if (isOwner && ownerCanSet.includes(status)) {
            foundBooking.status = status
        } else if (isCustomer && customerCanSet.includes(status)) {
            foundBooking.status = status
        } else {
            return res.status(403).json({ message: "You cannot set this status" })
        }

        await foundBooking.save()
        res.status(200).json(foundBooking)
    } catch (err) {
        console.log(err)
        if (err.code === 11000) {
            return res.status(409).json({ message: "This date is already booked" })
        }
        res.status(500).json({ message: "Internal Server Error" })
    }
})


router.put("/:id", validateObjectId, async (req, res) => {
    try {
        const { date, notes, timeOfDay } = req.body


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
        const thisBooking = await Booking.findById(req.params.id)
        const getVenue = await Venue.findById(thisBooking.venue)
        if (!getVenue) {
            return res.status(404).json({ message: 'Venue not found' })
        }

        const rawDate = new Date(req.body.date);
        bookingDate = new Date(Date.UTC(
            rawDate.getUTCFullYear(),
            rawDate.getUTCMonth(),
            rawDate.getUTCDate()
        ));

        // Is the date blocked by the owner?
        const blocked = await BlockedDate.findOne({ venue: req.params.id, date: bookingDate })
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

        const newBooking = await Booking.findByIdAndUpdate(req.params.id, {
            date: bookingDate,
            timeOfDay: timeOfDay,
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


router.delete("/:id", validateObjectId, async (req, res) => {
    try {
        const foundBooking = await Booking.findById(req.params.id).populate("venue")

        if (!foundBooking) {
            return res.status(404).json({ message: "Booking not found" })
        }

        // The owner is stored on the venue, not on the booking
        const isCustomer = foundBooking.customer.equals(req.user._id)
        const isVenueOwner = foundBooking.venue && foundBooking.venue.owner && foundBooking.venue.owner.equals(req.user._id)

        if (isCustomer || isVenueOwner || req.user.role === 'admin') {
            const deletedBooking = await Booking.findByIdAndDelete(req.params.id)
            return res.status(200).json(deletedBooking)
        } else {
            return res.status(403).json({ message: "You cannot delete this booking" })
        }
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: "Internal Server Error" })
    }
})

module.exports = router
