var express = require("express");
var mongoose = require("mongoose");
var exphbs = require("express-handlebars");
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = 3000;

// Initialize Express
var app = express();

// Configure middleware
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

// Connect to the Mongo DB
let MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/headlines";
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
                .attr("src")

                db.Article.create(result)
                    .then(function (dbArticle) {
                        console.log(dbArticle);
                    })
                    .catch(function (err) {
                        console.log(err);
                    });
        });

        res.send("Scrape Complete");
    });
});

app.get("/articles", function (req, res) {
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
            return db.Article.findOneAndUpdate({ "_id": o_id }, { $push: {note: dbNote._id }}, { new: true });
        })
        .then(function (dbArticle) {
            res.json(dbArticle);
        })
        .catch(function (err) {
            res.json(err);
        });
});

app.put("/articles/:id", function(req, res) {
    let ObjectId = require("mongodb").ObjectId;
    let id = req.params.id;
    let o_id = new ObjectId(id);
    console.log("this is the id");
    console.log(id);
    console.log(req.body);

    db.Note.deleteOne({"_id": o_id})
    .then(function (dbArticle) {
        res.json(dbArticle);
    })
    .catch(function(err) {
        res.json(err);
    });
});

// Start the server
app.listen(PORT, function () {
    console.log("App running on port " + PORT + "!");
});
