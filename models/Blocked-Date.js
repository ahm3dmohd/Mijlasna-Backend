const mongoose = require("mongoose")

const blockedDateSchema = new mongoose.Schema({
    venue: {
        type: mongoose.Schema.Types.ObjectId,
        ref:"Venue",
        required:true
    },
    date: {
        type: Date,
         required:true
    },
    slotLabel: {
        type: String,
    },
    startTime: {
        type: String,
    },
    endTime: {
        type: String,
    },
    reason: {
        type: String,
    }
    
})

blockedDateSchema.index({ venue: 1, date: 1 }, { unique: true })

const BlockedDate = mongoose.model('BlockedDate', blockedDateSchema)

module.exports = BlockedDate