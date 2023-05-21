const mongoose = require('mongoose')


const schema = new mongoose.Schema({
    body : String,
    trackName : String,
    trackID : String,
    userID : String,
    rating : Number,
    date : {type : Date, default : Date.now}    
})

const comment = mongoose.model('TrackComment',schema)

module.exports = comment;