const mongoose = require('mongoose')


const schema = new mongoose.Schema({
    body : String,
    albumName : String,
    albumID : String,
    userID : String,
    rating : Number,
    date : {type : Date, default : Date.now}    
})

const comment = mongoose.model('AlbumComment',schema)

module.exports = comment;