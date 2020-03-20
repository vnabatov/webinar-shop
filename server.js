var path = require('path')
var mime = require('mime')
var fs = require('fs')
var express = require('express')
var YaDisk = require('ya-disk')

var disk = new YaDisk({ token: process.env.YANDEX_TOKEN })

var app = express()

const addDays = function (dateOld, days) {
  var date = new Date(dateOld)
  date.setDate(date.getDate() + days)
  return date
}

let links = {
  '73a90acaae2b1ccc0e969709665bc62f': {
    filename: 'image1.jpg',
    dateExpires: new Date('2020-03-25T18:15:34.306Z')
  },
  '0f4b7ef21da9725c1baae7f91a990c6f': {
    filename: 'LP.webm',
    dateExpires: new Date('2020-03-25T18:15:34.306Z')
  }
}

app.get('/get', async function (req, res) {
  if (!links[req.query.pass]) {
    res.send('ссылка не найдена')
  }

  if ((new Date()).valueOf() > new Date(links[req.query.pass].dateExpires)) {
    res.send('ссылка не активна')
  }

  await new Promise((resolve) => {
    disk.request('get', { path: 'test-webinar/' + links[req.query.pass] })
      .then(function (res) {
        resolve()
      }, function (err) {
        console.log(err)
      })
  })

  var filePath = path.join(__dirname, links[req.query.pass].filename)

  var filename = path.basename(filePath)
  var mimetype = mime.lookup(filePath)

  res.setHeader('Content-disposition', 'attachment; filename=' + filename)
  res.setHeader('Content-type', mimetype)
  var filestream = fs.createReadStream(filePath)
  filestream.pipe(res)
})

app.get('/admin/list', async function (req, res) {
  // /admin/list?adminPass=<>
  if (process.env.ADMIN_PASS && (req.query.adminPass === process.env.ADMIN_PASS)) {
    res.send(links)
  }
})

app.get('/admin/remove', async function (req, res) {
  // /admin/remove?adminPass=<>&pass=<>&filename=<>
  if (process.env.ADMIN_PASS && (req.query.adminPass === process.env.ADMIN_PASS)) {
    delete links[req.query.remove]
    res.send(links)
  }
})

app.get('/admin/add', async function (req, res) {
  // /admin/add?adminPass=<>&pass=<>&filename=<>
  if (process.env.ADMIN_PASS && req.query.filename && req.query.pass && (req.query.adminPass === process.env.ADMIN_PASS)) {
    links[req.query.pass] = { filename: req.query.filename, date: addDays(new Date(), 5) }
    res.send(links)
  }
})

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})
