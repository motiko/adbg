var express = require("express")
var path = require("path")
var bodyParser = require("body-parser")
var mongodb = require("mongodb")
var ObjectID = mongodb.ObjectID

var app = express()
app.use(bodyParser.json())

var db

mongodb.MongoClient.connect(process.env.MONGODB_URI, function(err, database) {
  if (err) {
    console.log(err)
    process.exit(1)
  }

  db = database
  console.log("Database connection ready")

  var server = app.listen(process.env.PORT || 8080, function() {
    var port = server.address().port
    console.log("App now running on port", port)
  })
})

function handleError(res, reason, message, code) {
  console.log("ERROR: " + reason)
  res.status(code || 500).json({"error": message})
}

app.get('/messages', function(req, res) {
  db.collection('messages').find({}).toArray(function(err, docs) {
    if (err) {
      handleError(res, err.message, "Failed to get messages.");
    } else {
      res.status(200).json(docs);
    }
  });
})

app.post("/messages", function(req, res) {
  if ( !validMessage(req.body)) {
    handleError(res, "Invalid message", "Must enter text.", 400)
    return;
  }
  let newMessage = createMessage(req.body)
  db.collection('messages').insertOne(newMessage, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed db creation")
    } else {
      res.status(201).json(doc.ops[0])
    }
  })
})

app.post("/messages/:id/reply", function(req, res) {
  if ( !validMessage(req.body)) {
    handleError(res, "Invalid message", "Must enter text.", 400)
    return;
  }
  var replyMsg = createMessage(req.body)


  db.collection('messages').updateOne({_id: new ObjectID(req.params.id)},
    {$push: {replies: replyMsg}},
  function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to update contact")
    } else {
      res.status(204).end()
    }
  })
})

function createMessage(fromObj){
  var newMessage = {}
  newMessage.body = fromObj.body.toString().substr(0,1000)
  newMessage.author = fromObj.author ? fromObj.author.toString().substr(0,80) : ''
  newMessage.createdAt = Date.now()
  return newMessage
}

function validMessage(msg){
  return msg.body && msg.body != ""
}
