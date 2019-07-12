const express = require('express');
const app = express();
const access = require('./access');
const catchException = require('./utils/catchException');

app.use(express.json());
app.post('/book', catchException(async (req, res) => {
  if (req.body.title && req.body.author && req.body.text) {
    const result = await access.saveBook(req.body.title, req.body.author, req.body.text);
    if (result) res.json({message: 'added'});
  } else {
    throw 'fill all the fields';
  }
}));
app.get('/book/:title', catchException(async (req, res) => {
  const result = await access.findBookByTitleCached(req.params.title);
  if (result) {res.json(result)} else {
    throw Error
  }
}));
app.put('/book/:title', catchException(async (req, res) => {
  const result = await access.updateBookByTitle(req.params.title, req.body.author, req.body.text);
  if (result) res.json(result);
}));
app.use((error, req, res, next) => {
  console.log(error);
  res.status(500).json({error: error.message});
})



module.exports = app;