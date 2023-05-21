const mongoose = require('mongoose')


const schema = new mongoose.Schema({
    body : String,
    artistName : String,
    artistID : String,
    userID : String,
    rating : Number,
    date : {type : Date, default : Date.now}    
})

const comment = mongoose.model('ArtistComment',schema)

module.exports = comment;