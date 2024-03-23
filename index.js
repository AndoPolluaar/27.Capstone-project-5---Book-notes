import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import pg from "pg";
import { validationResult, body } from "express-validator";


const app = express();
const port = 3000;
const API_URL = "https://covers.openlibrary.org/b/id";

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "books",
  password: "Network87!",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let books = [];

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const validateInputs = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

app.get("/", async (req, res) => {
  try {
    const dbResult = await db.query("SELECT * FROM books ORDER BY rating ASC");
    
    books = dbResult.rows;
    
  res.render("index.ejs", {
    listTitle: "My book list",
    listItems: books,
  });
} catch (err) {
  console.log(err);
  res.status(500).send("An error occured.");
}
});

app.post("/add", validateInputs, async (req, res) => {
  const item = {
    title: req.body.title,
    author: req.body.author,
    rating: req.body.rating,
    conclusion: req.body.conclusion,
    cover_isbn: req.body.cover_isbn,
    cover_url: req.body.cover_url
  };  
  //items.push({ title: item });
  try {
    await db.query("INSERT INTO books (title, author, rating, conclusion, created_at, cover_isbn, cover_url) VALUES ($1, $2, $3, $4, NOW(), $5, $6)", 
    [item.title, item.author, item.rating, item.conclusion, item.cover_isbn, item.cover_url]);
    const axiosResult = await axios.get(API_URL + "/" + req.body.cover_isbn + "-L.jpg");
  res.redirect("/");
} catch (err) {
  console.log(err);
  res.status(500).send("Failed to add a new book.");
}
});

app.post("/edit", validateInputs, async (req, res) => {
  const { 
    updatedItemTitle,
    updatedItemAuthor,
    updatedItemRating,
    updatedItemConclusion,
    updatedItemCoverISBN,
    updatedItemCoverURL,
    updatedItemId,   
  } = req.body;

  try {
    await db.query("UPDATE books SET title = $1, author = $2, rating = $3, conclusion = $4, cover_isbn = $5, cover_url = $6 WHERE id = $7", 
    [   
      updatedItemTitle, 
      updatedItemAuthor, 
      updatedItemRating, 
      updatedItemConclusion,
      updatedItemCoverISBN,
      updatedItemCoverURL, 
      updatedItemId]);
      
    res.redirect("/");
  } catch (err) {
    console.log(err);
    res.status(500).send("Failed to update book details.");
  }
});

app.post("/delete", [body("deleteItemId").isInt()], validateInputs, async (req, res) => {
  const id = req.body.deleteItemId;

  try {
    await db.query("DELETE FROM books WHERE id = $1", [id]);
    res.redirect("/");
  } catch (err) {
    console.log(err);
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});