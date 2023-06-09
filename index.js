const express = require("express");
const cors = require("cors")
const jwt = require("jsonwebtoken");
const Datastore = require('nedb')
var querystring = require('querystring');
const cookieParser = require("cookie-parser");
const path = require('path')
const rateLimit = require('express-rate-limit')
var bodyParser = require('body-parser')
const mongoose = require('mongoose')
const ArtistComment = require('./models/Artist_Comment')
const AlbumComment = require('./models/Album_Comment')
const TrackComment = require('./models/Track_Comment');
const comment = require("./models/Artist_Comment");
require('dotenv').config()

const DATABASE_URL = process.env.DATABASE_URL
const CONFIG = {
  useNewUrlParser: true,
  useUnifiedTopology: true
}

mongoose.connect(DATABASE_URL, CONFIG)
mongoose.connection
  .on("open", () => {
    console.log("Connected to Mongoose")
    app.listen(PORT, () => {
      console.log('listenting on ' + PORT + '......')
    })
  })
  .on("close", () => console.log("Disconnected from Mongoose"))
  .on("error", (error) => console.log(error))

let app = express();

app.use(cors({
  'allowedHeaders': ['sessionId', 'Content-Type', 'Authorization'],
  'exposedHeaders': ['sessionId'],
  'origin': 'https://willowy-meerkat-6bb39e.netlify.app',
  'methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
  'preflightContinue': false,
  'credentials': true,
}));
app.use(cookieParser())
//app.use(express.json())
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json()) 

const PORT = process.env.PORT || 4000

const client_id = '55f4fa1f3dab45179c7fa8cef3bcb837';
const client_secret = 'b6e74b093f73427fb04de2ffc0e23ea7';
const jwtSecret = client_secret;
var redirect_uri = "https://myspotify.herokuapp.com/callback"
var state = generateRandomString(16);
var auth
var user_token_data

app.get('/', (req, res) => {
  console.log("got")
  res.send('got')
})

app.get('/callback', (req, res) => {
  console.log(state)
  console.log(req.query)
  if (req.query.state == state) {
    auth = req.query.code
    const tokenEndpoint = 'https://accounts.spotify.com/api/token';

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(client_id + ':' + client_secret)
      },
      body: new URLSearchParams({
        code: auth,
        redirect_uri: 'https://myspotify.herokuapp.com/callback',
        grant_type: 'authorization_code'
      })
    };
    fetch(tokenEndpoint, options)
      .then(response => response.json())
      .then(data => {
        user_token_data = data;
        console.log(user_token_data)
        const jwtToken = jwt.sign({ access_token: user_token_data.access_token }, jwtSecret, { expiresIn: '1h' });
        res.redirect(`https://willowy-meerkat-6bb39e.netlify.app/profile?jwt=${jwtToken}`);
      })
      .catch(error => {
        console.log("callback:" + error)
      });
  }
  else {
    console.log('callback issue')
  }

})

app.use(rateLimit({
  windowMs: 1 * 1000,
  max: 1
}))

app.get('/user', (req, res) => {
  const token = 'https://api.spotify.com/v1/me'
  const authHeader = req.headers.authorization;
  const atoken = authHeader && authHeader.split(" ")[1];
  const jwtPayload = jwt.verify(atoken, jwtSecret);
  const access = jwtPayload.access_token;
  const options = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Bearer ' + access
    }
  };
  fetch(token, options)
    .then(response => response.json())
    .then(data => {
      const userid = jwt.sign({ id: data.id }, jwtSecret, { expiresIn: '1h' })
      res.json({
        body: data,
        id: userid
      });
    })
    .catch(err => console.error(err));
})

app.get('/track', (req, res) => {
  const authHeader = req.headers.authorization;
  const atoken = authHeader && authHeader.split(" ")[1];
  const jwtPayload = jwt.verify(atoken, jwtSecret);
  const access = jwtPayload.access_token;
  const query = req.query.q

  const token = `https://api.spotify.com/v1/tracks/${query}`

  const options = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Bearer ' + access
    }
  };
  fetch(token, options)
    .then(response => response.json())
    .then(data => {
      TrackComment.find()
        .then(comments => {
          res.json({
            data: data,
            comments: comments
          })
        })
    })
    .catch(error => {
      console.log(error);
      console.log('failed');
    });
})

app.post('/track', (req, res) => {
  const comment = new TrackComment({
    body: req.body.body,
    trackName: req.nody.trackName,
    trackID: req.body.trackID,
    userID: jwt.sign(req.body.userID, jwtSecret).id,
    rating: req.body.rating
  })

  comment.save()
})

app.get('/artist', (req, res) => {
  const authHeader = req.headers.authorization;
  const atoken = authHeader && authHeader.split(" ")[1];
  const jwtPayload = jwt.verify(atoken, jwtSecret);
  const access = jwtPayload.access_token;
  const query = req.query.q

  const token = `https://api.spotify.com/v1/artists/${query}`

  const options = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Bearer ' + access
    }
  };
  fetch(token, options)
    .then(response => response.json())
    .then(data => {
      ArtistComment.find()
        .then(comments => {
          res.json({
            data: data,
            comments: comments
          })
        })
    })
    .catch(error => {
      console.log(error);
      console.log('failed');
    });
})

app.post('/artist', (req, res) => {
  const comment = new ArtistComment({
    body: req.body.body,
    artistName: req.body.artistName,
    artistID: req.body.artistID,
    userID: jwt.verify(req.body.userID, jwtSecret).id,
    rating: req.body.rating
  })

  comment.save();
})

app.get('/album', (req, res) => {
  const authHeader = req.headers.authorization;
  const atoken = authHeader && authHeader.split(" ")[1];
  const jwtPayload = jwt.verify(atoken, jwtSecret);
  const access = jwtPayload.access_token;
  const query = req.query.q

  const token = `https://api.spotify.com/v1/albums/${query}`

  const options = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Bearer ' + access
    }
  };
  fetch(token, options)
    .then(response => response.json())
    .then(data => {
      AlbumComment.find()
        .then(comments => {
          res.json({
            data: data,
            comments: comments
          })
        })
    })
    .catch(error => {
      console.log(error);
      console.log('failed');
    });
})

app.post('/album', (req, res) => {
  const comment = new AlbumComment({
    body : req.body.body,
    albumName : req.body.albumName,
    albumID : req.body.albumID,
    userID : jwt.verify(req.body.userID,jwtSecret).id,
    rating : req.body.rating
  })

  comment.save()
    .then(() => {
      res.sendStatus(200); // Send a success status code
    })
    .catch((error) => {
      console.error('Error saving comment:', error);
      res.sendStatus(500); // Send an error status code
    });

})

app.get('/top', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: "No authorization header found." });
    return;
  }

  const atoken = authHeader && authHeader.split(" ")[1];
  const jwtPayload = jwt.verify(atoken, jwtSecret);
  const access = jwtPayload.access_token;

  const token = `https://api.spotify.com/v1/me/top/artists?time_range=medium_term&limit=20&offset=0`;

  const options = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Bearer ' + access
    }
  };

  fetch(token, options)
    .then(response => response.json())
    .then(data => {
      res.json(data)
    })
    .catch(error => {
      console.log(error);
      console.log('fail');
    });
})

app.get('/search', (req, res) => {
  const authHeader = req.headers.authorization;
  const atoken = authHeader && authHeader.split(" ")[1];
  const jwtPayload = jwt.verify(atoken, jwtSecret);
  const access = jwtPayload.access_token;
  const query = req.query.q
  console.log(query)
  const token = `https://api.spotify.com/v1/search?q=${query}&type=album%2Ctrack%2Cartist`
  const options = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Bearer ' + access
    }
  };
  fetch(token, options)
    .then(response => response.json())
    .then(data => {
      res.json(data)
    })
    .catch(error => {
      console.log(error);
      console.log('failed');
    });
})

app.get('/login', (req, res) => {
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: 'user-read-private user-top-read user-read-email user-read-recently-played',
      redirect_uri: redirect_uri,
      state: state,
    }));
  console.log("redirected")
})


function generateRandomString(length) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}


