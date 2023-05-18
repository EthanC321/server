const express = require("express");
const cors = require("cors")
const Datastore = require('nedb')
var querystring = require('querystring');
const cookieParser = require("cookie-parser");
const path  = require('path')

let app = express();
//const router = express.Router();

app.use(cors({
  'allowedHeaders': ['sessionId', 'Content-Type'],
  'exposedHeaders': ['sessionId'],
  'origin': 'https://willowy-meerkat-6bb39e.netlify.app',
  'methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
  'preflightContinue': false,
  'credentials': true,
}));
app.use(cookieParser())
//app.use(express.static(path.join(__dirname, '/public')));

const home = "http://localhost:4000"
const PORT = process.env.PORT || 4000

const client_id = '55f4fa1f3dab45179c7fa8cef3bcb837';
const client_secret = 'b6e74b093f73427fb04de2ffc0e23ea7';
var redirect_uri = "http://localhost:4000/callback"
var state = generateRandomString(16);
var auth
var user_token_data 


app.get('/',  (req,res) => {
    console.log("got")
    res.send('got')
})

app.get('/user',(req,res) => {
  const token = 'https://api.spotify.com/v1/me'
  const access = req.cookies.accessToken
  console.log('access ' + access)
  const options = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Bearer  ' + access
    }
  };
  fetch(token,options)
  .then(response => response.json())
  .then(data => {
    res.json(data);
  })
  .catch(err => console.error(err));
})

app.get('/user/top',(req,res) => {
  const access = req.cookies.accessToken
  res.redirect('/user/' + access + '/top')
})


app.get('/top',(req,res) => {
    const token = 'https://api.spotify.com/v1/me/top/artists';
    const access = req.cookies.accessToken

    const options = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Bearer  ' + access
      },
      time_range: 'medium_term',
      limit: 20,
      offset: 0
    };
    fetch(token,options)
    .then(response => response.json())
    .then(data => { 
      res.json(data)
    })
    .catch(error =>{console.log(error)
    console.log('failed')});
})

app.get('/user/:id',(req,res) => {
  res.send(req.params)
})

app.get('/callback',(req,res) => {
  console.log(state)
  console.log(req.query)
  if(req.query.state == state){
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
        redirect_uri: 'http://localhost:4000/callback',
        grant_type: 'authorization_code'
      })
    };
    fetch(tokenEndpoint, options)
    .then(response => response.json())
    .then(data => {
      user_token_data = data;
      console.log( user_token_data)
      res.cookie('accessToken', user_token_data.access_token, { httpOnly: true, sameSite: 'none', secure: true });
      res.redirect('https://willowy-meerkat-6bb39e.netlify.app/profile')
    })
    .catch(error => {
      console.log("callback:" + error)
    });
    }
    else{
      console.log('callback issue')
    }
  
})

app.get('/login',(req,res) => {
    res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: 'user-read-private user-top-read user-read-email user-read-recently-played',
      redirect_uri: redirect_uri,
      state: state,
      show_dialog: true
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

app.listen(PORT,() => {
  console.log('listenting on ' + PORT + '......')
})
