const connectToDB = require('./config/db.js')
const express = require("express")
const app = express()
const dotenv = require("dotenv").config()
const morgan = require('morgan')
const cors = require('cors')

const authRoutes = require('./routes/auth.routes')
const userRoutes = require('./routes/user.routes')
const venueRoutes = require('./routes/venue.routes')
const bookingRoutes = require('./routes/booking.routes')

app.use(
    cors({
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
    })
)
app.use(express.json())
app.use(morgan('dev'))



app.get('/', (req, res) => {
    res.status(200).json({ Message: 'Welcome Home!' })
})
app.use('/auth', authRoutes)
app.use('/users', userRoutes)
app.use('/venues', venueRoutes)
app.use('/bookings', bookingRoutes)


async function startServer() {
    const PORT = process.env.PORT || 3000
    await connectToDB()

    app.listen(PORT, () => {
        console.log(`App is running on port ${PORT}`)
    })
}
startServer()