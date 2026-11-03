const router = require("express").Router()
const verifyToken = require("../middleware/verifyToken")
const authorize = require("../middleware/authorize")
const validateObjectId = require("../middleware/validateObjectId")
const Booking = require("../models/Booking")
const Venue = require("../models/Venue")

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


router.patch("/:id/status", validateObjectId, async (req, res) => {
    try {
        const { status } = req.body
        const foundBooking = await Booking.findById(req.params.id).populate("venue")

        const isOwner = foundBooking.venue && foundBooking.venue.owner && foundBooking.venue.owner.equals(req.user._id)
        const isCustomer = foundBooking.customer.equals(req.user._id)

        const ownerCanSet = ["confirmed", "rejected", "completed"]
        const customerCanSet = ["cancelled"]

        if (isOwner && ownerCanSet.includes(status)) {
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
        const foundBooking = await Booking.findById(req.params.id)

        if (foundBooking.customer.equals(req.user._id)
            || foundBooking.owner.equals(req.user._id)
            || req.user.role === 'admin') {
            const updatedBooking = await Booking.findByIdAndUpdate(
                req.params.id,
                { notes: req.body.notes },
                { new: true, runValidators: true }
            )
            return res.status(200).json(updatedBooking)
        } else {
            return res.status(403).json({ message: "You cannot edit this booking" })
        }
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: "Internal Server Error" })
    }
})


router.delete("/:id", validateObjectId, async (req, res) => {
    try {
        const foundBooking = await Booking.findById(req.params.id)

        if (foundBooking.customer.equals(req.user._id)
            || foundBooking.owner.equals(req.user._id)
            || req.user.role === 'admin') {
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
