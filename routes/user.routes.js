const router = require("express").Router()
const bcrypt = require("bcrypt")
const User = require("../models/User")
const Venue = require("../models/Venue")
const Booking = require("../models/Booking")
const BlockedDate = require("../models/Blocked-Date")
const Review = require("../models/Review")
const verifyToken = require("../middleware/verifyToken")
const authorize = require("../middleware/authorize")
const validateObjectId = require("../middleware/validateObjectId")


router.use(verifyToken)

// When a user is deleted, remove everything that belonged to them:
// their venues (with those venues' bookings, blocked dates and reviews),
// their own bookings and their own reviews
async function deleteUserData(userId) {
  const myVenues = await Venue.find({ owner: userId }).select("_id")
  const venueIds = myVenues.map((venue) => venue._id)

  await Booking.deleteMany({ venue: { $in: venueIds } })
  await BlockedDate.deleteMany({ venue: { $in: venueIds } })
  await Review.deleteMany({ venue: { $in: venueIds } })
  await Venue.deleteMany({ _id: { $in: venueIds } })

  await Booking.deleteMany({ customer: userId })
  await Review.deleteMany({ customer: userId })
}

// Get User /users/me (which is my profile)

router.get("/me", async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    if (!user) return res.status(404).json({ message: "User not found" })
    res.status(200).json(user)
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: "Internal Server Error" })
  }
})

router.put("/me", async (req, res) => {
  try {
    const { username, email, phone, password } = req.body

    const user = await User.findByIdAndUpdate(req.user._id, { username, email, phone, hashedPassword: await bcrypt.hash(password, 12) }, { new: true, runValidators: true })
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (err) {
    console.log(err);
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return res.status(409).json({ message: `${field} already exists` });
    }
    res.status(500).json({ message: "Internal Server Error" });
  }
})

router.delete("/me", async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.user._id)
    if (!user) return res.status(404).json({ message: "User not found!" })
    await deleteUserData(user._id)
    res.status(200).json({ message: "User deleted successfully.." })
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: "Internal Server Error" })
  }
})


router.get("/", authorize("admin"), async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get("/:id", authorize("admin"), validateObjectId, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// PUT /users/:id - admin: edit any user, including their role
router.put("/:id", authorize("admin"), validateObjectId, async (req, res) => {
  try {
    const { username, email, phone, password } = req.body;

    const user = await User.findByIdAndUpdate(req.params.id, {username, email, phone, hashedPassword: await bcrypt.hash(password, 12)}, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (err) {
    console.log(err);
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return res.status(409).json({ message: `${field} already exists` });
    }
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.delete("/:id", authorize("admin"), validateObjectId, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    await deleteUserData(user._id);
    res.status(200).json({ message: "User deleted" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;