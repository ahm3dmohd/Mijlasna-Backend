const router = require("express").Router()
const verifyToken = require("../middleware/verifyToken")
const Booking = require("../models/Booking")


router.post("/", verifyToken, async (req, res) => {
    try {
        const { venue, date, totalPrice, deposit, notes } = req.body
        const newBooking = await Booking.create({
            venue: venue,
            customer: req.user._id,
            date: date,
            totalPrice: totalPrice,
            deposit: deposit,
            notes: notes,
        })

        res.status(201).json(newBooking)

    } catch (err) {
        console.log(err)
        res.status(500).json({ err: err.message })
    }
})


router.get("/", verifyToken, async (req, res) => {
    try {
        const allBookings = await Booking.find()
            .populate("venue")
            .populate("customer")

        res.json(allBookings)

    } catch (err) {
        console.log(err)
    }
})


router.get("/:bookingId", verifyToken, async (req, res) => {
    try {
        const foundBooking = await Booking.findById(req.params.bookingId)
            .populate("venue")
            .populate("customer")

        res.json(foundBooking)

    } catch (err) {
        console.log(err)
        res.status(500).json({ error: err.message })
    }
})


router.put("/:bookingId", verifyToken, async (req, res) => {
    try {
        const foundBooking = await Booking.findById(req.params.bookingId)

        if (!foundBooking) {
            return res.status(404).json({ message: 'Booking not found' })
        }

        if (foundBooking.customer == req.user._id) {
            const updatedBooking = await Booking.findByIdAndUpdate(
                req.params.bookingId,
                req.body,
                { new: true }
            )
            return res.json(updatedBooking)
        } else {
            return res.status(403).json({ message: 'You cannot edit this booking' })
        }
    } catch (err) {
        console.log(err)
        res.status(500).json({ error: err.message })
    }
})

router.delete('/:bookingId', verifyToken, async (req, res) => {
    try {
        const foundBooking = await Booking.findById(req.params.bookingId)

        if (!foundBooking) {
            return res.status(404).json({ message: 'Booking not found' })
        }

        if (foundBooking.customer == req.user._id) {
            const deletedBooking = await Booking.findByIdAndDelete(req.params.bookingId)
            return res.json(deletedBooking)
        } else {
            return res.status(403).json({ message: 'You cannot delete this booking' })
        }
    } catch (err) {
        console.log(err)
        res.status(500).json({ error: err.message })
    }
})



module.exports = router