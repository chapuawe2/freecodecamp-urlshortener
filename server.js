require('dotenv').config();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const dns = require('dns');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;
mongoose.connect(process.env.MONGOURI);

const shortSchema = new mongoose.Schema({
  url: String,
  id: Number
})

const Short = mongoose.model('Short', shortSchema);

function parseDocument(data) {
  return {
    original_url: data.url,
    short_url: data.id
  }
}

app.use(cors());
app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.post('/api/shorturl', bodyParser.urlencoded({
  extended: false
}));

app.post('/api/shorturl', (req, res)=>{
  const url = req.body.url;
  console.log(url);

  const urlRegex = 
  new RegExp("^https?://[a-z0-9-]+\.[a-z]+");

  if (urlRegex.test(url)){
    Short.findOne({url: url}, (err, data)=>{
      if (err) return res.json(err);

      if (data){
        res.json(parseDocument(data));
      } else {
        Short.estimatedDocumentCount((err, data)=>{
          if (err) return res.json(err);

          const short = new Short({
            url: url,
            id: data + 1
          })

          short.save((err, data)=>{
            if (err) return res.json(err);

            res.json(parseDocument(data));
          })
        })
      }
    })
  } else {
    res.json({
      error: "Invalid URL"
    })
  }
})

app.get('/api/shorturl/:id', (req, res)=>{
  console.log(req.params.id);

  Short.findOne({
    id: req.params.id
  }, (err, data)=>{
    if (err) return res.json(err);

    if (data){
      res.redirect(data.url);
    } else {
      res.json({
        error: "No short URL found for the given input"
      });
    }
  })
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});