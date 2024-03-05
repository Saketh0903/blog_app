//create user api app
const exp = require("express");
const userApp = exp.Router();
const bcryptjs = require("bcryptjs");
const expressAsyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const verifyToken=require('../Middleware/validToken')
require("dotenv").config();

let usersCollection;
let articlesCollection;
//get usersCollection app
userApp.use((req, res, next) => {
  usersCollection = req.app.get("usersCollection");
  articlesCollection = req.app.get("articlesCollection");
  next();
});

//user registration route
userApp.post(
  "/user",
  expressAsyncHandler(async (req, res) => {
    //get user resource from client
    const newUser = req.body;
    //check for duplicate user based on username
    const dbuser = await usersCollection.findOne({ username: newUser.username });
    //if user found in db
    if (dbuser !== null) {
      res.send({ message: "User existed" });
    } else {
      //hash the password
      const hashedPassword = await bcryptjs.hash(newUser.password, 6);
      //replace plain pw with hashed pw
      newUser.password = hashedPassword;
      //create user
      await usersCollection.insertOne(newUser);
      //send res
      res.send({ message: "User created" });
    }
  })
);

//user login
userApp.post(
  "/login",
  expressAsyncHandler(async (req, res) => {
    //get cred obj from client
    const userCred = req.body;
    //check for username
    const dbuser = await usersCollection.findOne({
      username: userCred.username,
    });
    if (dbuser === null) {
      res.send({ message: "Invalid username" });
    } else {
      //check for password
      const status = await bcryptjs.compare(userCred.password, dbuser.password);
      if (status === false) {
        res.send({ message: "Invalid password" });
      } else {
        //create jwt token and encode it
        const signedToken = jwt.sign(
          { username: dbuser.username },
          process.env.SECRET_KEY,
          { expiresIn: '1d' }
        );
        //send res
        res.send({
          message: "login success",
          token: signedToken,
          user: dbuser,
        });
      }
    }
  })
);

//get articles of all authors
userApp.get(
  "/articles",verifyToken,
  expressAsyncHandler(async (req, res) => {
    //get articlescollection from express app
    const articlesCollection = req.app.get("articlesCollection");
    //get all articles
    let articlesList = await articlesCollection
      .find({ status: true })
      .toArray();
    //send res
    res.send({ message: "articles", payload: articlesList });
  })
);

//post comments for an arcicle by atricle id
userApp.post(
  "/comment/:articleId",verifyToken,
  expressAsyncHandler(async (req, res) => {
    //get user comment obj
    const userComment = req.body;
    const articleIdFromUrl=req.params.articleId;
    //insert userComment object to comments array of article by id
    let result = await articlesCollection.updateOne(
      { articleId: articleIdFromUrl},
      { $addToSet: { comments: userComment } }
    );
    console.log(result);
    res.send({ message: "Comment posted" });
  })
);

//export userApp
module.exports = userApp;