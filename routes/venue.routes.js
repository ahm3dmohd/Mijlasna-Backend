const mongoose = require('mongoose')
const router = require('express').Router()
const Venue = require('../models/Venue')
const verifyToken = require('../middleware/verifyToken')
const validateObjectId = require('../middleware/validateObjectId')
const Review = require('../models/Review')
const Booking = require('../models/Booking')

router.get('/', verifyToken, async (req, res) => {
    try {
        const allVenues = await Venue.find()
        res.json(allVenues)
    } catch (err) {
        return res.json(err)
    }
})

router.get('/:id', verifyToken, validateObjectId, async (req, res) => {
    try {
        const oneVenue = await Venue.findById(req.params.id)
        res.json(oneVenue)
    } catch (err) {
        return res.json(err)
    }
})

router.post('/:id', verifyToken, validateObjectId, async (req, res) => {
    try {
        if (req.user.type !== 'owner') {
            return res.json({ 'message': 'You are not permitted to create venues.' })
        }

        const [name, type, description, address, capacity, weekDayPrice, weekendPrice] = req.body
        const newVenue = await Venue.create({
            name: name,
            type: type,
            description: description,
            address: address,
            capacity: capacity,
            images: null,
            weekendPrice: weekendPrice,
            weekDayPrice: weekDayPrice,
            owner: req.user._id
        })
        res.json(newVenue)
    } catch (err) {
        return res.json(err)
    }
})

router.put('/:id', verifyToken, validateObjectId, async (req, res) => {
    try {
        const getVenueOwner = await Venue.findById(req.params.id)
        if (req.user.type !== 'owner' || req.user._id !== getVenueOwner.owner) {
            return res.json({ 'message': 'You do not have permission to edit this venue.' })
        }

        const [name, type, description, address, capacity, weekDayPrice, weekendPrice] = req.body
        const editedVenue = await Venue.findByIdAndUpdate(req.params.id, {
            name: name,
            type: type,
            description: description,
            address: address,
            capacity: capacity,
            images: null,
            weekendPrice: weekendPrice,
            weekDayPrice: weekDayPrice,
            owner: req.user._id
        }, { new: true })
        res.json(editedVenue)
    } catch (err) {
        return res.json(err)
    }
})

router.delete('/:id', verifyToken, validateObjectId, async (req, res) => {
    try {
        const getVenueOwner = await Venue.findById(req.params.id)
        if (req.user.type !== 'owner' || req.user._id !== getVenueOwner.owner) {
            return res.json({ 'message': 'You do not have permission to delete this venue.' })
        }
        const deletedVenue = await Venue.findByIdAndDelete(req.params.id)
        res.json(deletedVenue)

    } catch (err) {
        return res.json(err)
    }
})

router.post("/:id/booking", verifyToken, async (req, res) => {
    try {

        const { date, notes } = req.body
        const day = date.getDay()
        const price = null
        const getVenue = await Venue.findById(req.params.id)
        if (day >= 0 && day < 4) {
            price = getVenue.weekDayPrice
        } else {
            price = getVenue.weekendPrice
        }

        const newBooking = await Booking.create({
            venue: req.params.id,
            customer: req.user._id,
            date: date,
            totalPrice: price,
            notes: notes
        })

        res.status(201).json(newBooking)

    } catch (err) {
        console.log(err)
        res.status(500).json({ err: err })
    }
})

router.get('/:id/reviews', verifyToken, async (req, res) => {
    try {
        const getReviews = await Review.find({ venue: req.params.id })
        res.json(getReviews)
    } catch (err) {
        console.log(err)
        res.status(500).json({ err: err })
    }
})

module.exports = router