const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const path = require('path');
const fs = require('fs');
require('dotenv').config();


const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true
}));
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(express.static('public'));
app.use(bodyParser.json());

mongoose.connect(process.env.MONGODB, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const countrySchema = new mongoose.Schema({
  countryName: {
    type: String,
    unique: true,
  },
  afkCount: {
    type: String,
    default: 0,
  },
  enteredWeb: {
    type: String,
    default: 0,
  }
});

const Country = mongoose.model('Country', countrySchema);

app.get('/country', async (req, res, next) => {
  if(!req.session.user){
    res.render('country')
    next();
  } else if(req.session.user){
    res.redirect('/afk');
  }
})

app.post('/country', async (req, res, next) => {
  const negara = req.body.negara;
  const country = await Country.findOne({ countryName: negara });
  if (!negara) {
    res.send('No Country Selected!');
    return;
  };
  if (!country) {
    const newCountry = new Country({
      countryName: negara,
      enteredWeb: 1,
    });
    await newCountry.save();
    req.session.user = newCountry;
  }
  country.enteredWeb++;
  await country.save();
  req.session.user = country;
  res.redirect('/afk');
})

app.get('/afk', async (req, res, next) => {
  if(!req.session.user){
    res.redirect('/country')
  } else if(req.session.user){
    const countrys = req.session.user;
    const country = await Country.findOne({ countryName: countrys.countryName})
    res.render('afk', { country });
  }
})

app.post('/afk', async (req, res, next) => {
  if(!req.session.user){
    res.redirect('/country')
  } else if(req.session.user){
    const countrys = req.session.user;
    const country = await Country.findOne({ countryName: countrys.countryName})
    country.afkCount++;
    await country.save();
    res.sendStatus(200);
  }
})

app.get('/json/:country', async (req, res, next) => {
  const { country } = req.params;
  try {
    const resp = await Country.findOne({ countryName: country })
      if(!country){
        res.json({
          res: "No Valid Country In Database."
        })
      } else {
        res.json({
          name: resp.countryName,
          count: resp.afkCount,
          entered: resp.enteredWeb
        })
      }
  } catch (err) {
    console.log(err);
    next(err);
  }
})

app.get('/', async (req, res, next) => {
  if(!req.session.user){
    res.redirect('/country')
  } else if(req.session.user){
    res.redirect('/afk')
  }
})
  
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});