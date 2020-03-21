var { v1 } = require('uuid')
var path = require('path')
var fs = require('fs')
var express = require('express')
const fileUpload = require('express-fileupload')

const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const adapter = new FileSync('db.json')
const db = low(adapter)
var app = express()
app.use(fileUpload())

const FILE_FOLDER_PATH = path.join(__dirname, 'upload')
const ADMIN_PASS = process.env.ADMIN_PASS
const PORT = 3333

db.defaults({ links: [] }).write()

const addDays = function (dateOld, days) {
  var date = new Date(dateOld)
  date.setDate(date.getDate() + days)
  return date
}

const checkAdmin = (req) => ADMIN_PASS && req.params.adminPass === ADMIN_PASS
const sendFileList = (res) => fs.readdir(FILE_FOLDER_PATH, function (err, files) {
  if (err) {
    return console.log('Unable to scan directory: ' + err)
  }
  res.send(files)
})
app.get('/get/:fileId', async function (req, res) {
  const fileId = req.params.fileId
  const file = db.get('links')
    .find({ fileId }).value()

  if (!file) {
    res.send('ссылка не найдена')
  }

  if ((new Date()).valueOf() > new Date(file.date)) {
    res.send('ссылка не активна (истёк срок действия)')
  }

  try {
    var filePath = path.join(FILE_FOLDER_PATH, file.filename)
    res.download(filePath)
  } catch (e) {
    res.send('файл не найден')
  }
})

app.get('/admin/:adminPass/list', async function (req, res) {
  if (checkAdmin(req)) {
    console.log(db.get('links').value())
    res.send(db.get('links').value())
  }
})
app.get('/admin/:adminPass/filesList', async function (req, res) {
  if (checkAdmin(req)) {
    sendFileList(res)
  }
})

app.get('/admin/:adminPass/remove/:removeId', async function (req, res) {
  const removeId = req.params.removeId
  if (checkAdmin(req) && removeId) {
    db.get('links')
      .remove({ fileId: removeId })
      .write()
    res.send(db.get('links').value())
  }
})
app.get('/admin/:adminPass/removeFile/:removeFileName', async function (req, res) {
  const removeFileName = req.params.removeFileName
  if (checkAdmin(req) && removeFileName) {
    fs.unlinkSync(path.join(FILE_FOLDER_PATH, removeFileName))
    sendFileList(res)
  }
})

app.get('/admin/:adminPass/add/:filePath/:comment/:days', async function (req, res) {
  const filename = req.params.filePath
  const comment = req.params.comment
  const days = parseInt(req.params.days, 10)
  if (filename && checkAdmin(req)) {
    const fileId = v1()
    db.get('links')
      .push({ fileId, filename, comment, date: addDays(new Date(), days) })
      .write()
    res.send(db.get('links').value())
  }
})

const staticFiles = ['index.html', 'index.css', 'index.js']
staticFiles.forEach(staticFile => {
  app.get('/admin/:adminPass/' + staticFile, async function (req, res) {
    if (checkAdmin(req)) {
      res.sendFile(path.join(path.join(__dirname), 'static', staticFile))
    }
  })
})
app.get('/admin/:adminPass/', async function (req, res) {
  if (checkAdmin(req)) {
    res.sendFile(path.join(path.join(__dirname), 'static', 'index.html'))
  }
})

app.post('/admin/:adminPass/upload', function (req, res) {
  if (checkAdmin(req)) {
    let sampleFile = req.files.sampleFile
    sampleFile.mv(path.resolve(FILE_FOLDER_PATH, sampleFile.name), function (err) {
      if (err) { return res.status(500).send(err) }
      res.redirect('/admin/' + req.params.adminPass + '/')
    })
  }
})

app.listen(PORT, function () {
  console.log('Example app listening on port ' + PORT)
})
