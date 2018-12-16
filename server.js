var express = require("express");
var mongoose = require("mongoose");
var exphbs = require("express-handlebars");
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = process.env.PORT || 3000;

// Initialize Express
var app = express();

// Configure middleware
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
// app.use(express.static("public"));

// Connect to the Mongo DB
//process.env.MONGODB_URI ||
let MONGODB_URI =  process.env.MONGODB_URI || "mongodb://curlyjoe71:lawgonz7581@ds259085.mlab.com:59085/heroku_l8zk8vms";
mongoose.connect(MONGODB_URI);

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Routes

// A GET route for scraping the towleroad website
app.get("/scrape", function (req, res) {

    

    axios.get("http://www.towleroad.com/").then(function (response) {
        // Then, we load that into cheerio and save it to $ for a shorthand selector
        var $ = cheerio.load(response.data);

        $("article").each(function (i, element) {
            var result = {};

            result.title = $(this)
                .children("header")
                .children("h2")
                .children("a")
                .text();
            result.summary = $(this)
                .children(".entry-content")
                .children("p")
                .text();
            result.link = $(this)
                .children("header")
                .children("h2")
                .children("a")
                .attr("href");
            result.image = $(this)
                .children(".entry-content")
                .children("a")
                .children("img")
                .attr("src");
            result.saved = false

            db.Article.create(result)
                .then(function (data) {
                    console.log(data);
                    res.json(data);
                })
                .catch(function (err) {
                    console.log(err);
                });
        });
    });

});

app.get("/articles", function (req, res) {
    db.Article.find({"saved": true})
        .then(function (dbArticle) {
            let obj = {
                dbArticle
            }
            res.render("articles", obj);
        })
        .catch(function (err) {
            res.json(err);
        });
});

app.post("/articles/removeall", (req, res) => {
    db.Article.update({"saved": true}, {$set: {"saved": false}}, {multi:true})
    .then((dbArticle) => {
        res.json(dbArticle);
    });
});

app.get("/", function (req, res) {
    db.Article.find({})
        .then(function (dbArticle) {
            let obj = {
                dbArticle
            }
            res.render("home", obj);
        })
        .catch(function (err) {
            res.json(err);
        });
});

app.get("/articles/:id", function (req, res) {

    let ObjectId = require("mongodb").ObjectId;
    let id = req.params.id;
    let o_id = new ObjectId(id);
    console.log("this is the id");
    console.log(id);

    db.Article.findOne({ "_id": o_id })
        .populate("note")
        .then(function (dbArticle) {
            let obj = {
                dbArticle
            };
            console.log(dbArticle);
            res.render("comments", dbArticle);
        })
        .catch(function (err) {
            res.json(err);
        });
});

app.get("/articles/save/:id", function (req, res) {
    let ObjectId = require("mongodb").ObjectId;
    let id = req.params.id;
    let o_id = new ObjectId(id);
    console.log("this is the id");
    console.log(id);

    db.Article.updateOne({ "_id": o_id }, { "saved": true }, function (err, data) {
        if (err) {
            console.log(err);
        }
        else {
            res.end;
        }
    });
});

app.post("/articles/remove/:id", function (req, res) {
    let ObjectId = require("mongodb").ObjectId;
    let id = req.params.id;
    let o_id = new ObjectId(id);
    console.log("this is the id");
    console.log(id);

    db.Article.updateOne({ "_id": o_id }, { "saved": false}, function(err, data) {
        if (err) {
            console.log(err);
        }
        else {
            res.json(data);
        };
    });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function (req, res) {
    let ObjectId = require("mongodb").ObjectId;
    let id = req.params.id;
    let o_id = new ObjectId(id);
    console.log("this is the id");
    console.log(id);
    console.log(req.body);

    db.Note.create(req.body)
        .then(function (dbNote) {
            return db.Article.findOneAndUpdate({ "_id": o_id }, { $push: { note: dbNote._id } }, { new: true });
        })
        .then(function (dbArticle) {
            res.json(dbArticle);
        })
        .catch(function (err) {
            res.json(err);
        });
});

app.put("/articles/:id", function (req, res) {
    let ObjectId = require("mongodb").ObjectId;
    let id = req.params.id;
    let o_id = new ObjectId(id);
    console.log("this is the id");
    console.log(id);
    console.log(req.body);

    db.Note.deleteOne({ "_id": o_id })
        .then(function (dbArticle) {
            res.json(dbArticle);
        })
        .catch(function (err) {
            res.json(err);
        });
});

// Start the server
app.listen(PORT, function () {
    console.log("App running on port " + PORT + "!");
});
