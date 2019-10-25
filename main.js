const Express = require("express");
const BodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectID;
const path = require('path');
const cors = require('cors')
require('dotenv').config()

const CONNECTION_URL = process.env.MONGODB_CONNECTION_STRING;
const DATABASE_NAME = "url-shortner";
const baseURL = process.env.BASE_URL;
var app = Express();

app.use(BodyParser.json());
app.use(BodyParser.urlencoded({ extended: true }));
app.use(cors())

var database, collection;

app.listen(8080, () => {
    MongoClient.connect(CONNECTION_URL, { useNewUrlParser: true }, (error, client) => {
        if(error) {
            throw error;
        }
        database = client.db(DATABASE_NAME);
        collection = database.collection("urls");
        console.log("Connected to `" + DATABASE_NAME + "`!");
    });
});


app.get('/status',function(req,res){
    res.status(200).send("Connected to `" + DATABASE_NAME + "`!");
  });

//index home page
app.get('/',function(req,res){
    res.sendFile(path.join(__dirname+'/index.html'));
    //__dirname : It will resolve to your project folder.
  });
app.use(Express.static('public'))  


//redirection logic
app.get("/:id", (request, response) => {
    let shortUrl = request.params.id;
    let redirectionUrl;
    collection.findOne({ "_id": shortUrl }, (error, result) => {
        if(error) {
            return response.status(500).send(error);
        }
        if(isEmpty(result)){
            return response.status(404).send("No Url Exists");
        }
        else{
            console.log("redirected");
            redirectionUrl = result.link;
            return response.redirect(301, redirectionUrl)
        }
    });
});

//generate shortlink

app.post("/build", (request, response) => {
    let basicLink = request.body.link;
    let shortenedLink = randomString(6);

    let myobj = { _id: shortenedLink, link: basicLink };
    collection.insert(myobj, (error, result) => {
        if(error) {
            return response.status(500).send(error);
        }
        console.log("1 document inserted");
        response.status(200).send(baseURL+shortenedLink);
    });
});


//custom functions 

function isEmpty(obj) {
    for(var prop in obj) {
        if(obj.hasOwnProperty(prop)) return false;
    }
    return true;
}

function randomString(len, charSet) {
  charSet = charSet || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var randomString = '';
  for (var i = 0; i < len; i++) {
      var randomPoz = Math.floor(Math.random() * charSet.length);
      randomString += charSet.substring(randomPoz,randomPoz+1);
  }
  return randomString;
}

module.exports = app;