import express from "express";
import bodyparser from "body-parser";
import mongoose from "mongoose";
import session from 'express-session';
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.set('view engine', 'ejs');
app.use(session({
  secret:"Thisissecret",
  resave:false,
  saveUninitialized:false
}));

app.use(bodyparser.urlencoded({extend:true}));
app.use(express.static("Public/Styles"));
mongoose.connect(process.env.mongo).then(()=>console.log("Connected mongodb"));

const Task = mongoose.model("Task",{name:String});
const task1 = new Task({name:"Welcome to your todolist!"});
const task2 = new Task({name:"Hit the + button to add a new item."});
const task3 = new Task({name:"<-- Hit this to delete an item."});

var today = new Date();
var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
var currentDate = today.toLocaleDateString(undefined, options);

const defaultItems = [task1,task2,task3];

const login = mongoose.model("Login",{username:String,password:String});
const Users = mongoose.model("Users", {
  username: String,
  List: {
    name: String,
    items: [{ name: String }]
  }
});

app.get("/",(req,res)=>{
  res.redirect("/auth/login")
});

app.get("/auth/login",(req,res)=>{
  if(req.session.user){
    res.redirect("/Today");
   }
   else{
  res.render("login.ejs",{check:true});
   }
});

app.post("/auth/login",(req,res)=>{
   const loguser = req.body.username;
   const userpass = req.body.password;
  
   login.findOne({username:loguser})
   .then((user)=>{
    if(user && user.password==userpass){
      req.session.user = loguser;
      res.redirect("/Today");
    }
    else{
      res.render("login.ejs",{check:false});
    }
   }
   )
});

app.get("/auth/register",(req,res)=>{
  if(req.session.user){
    res.redirect("/Today");
   }
   else{
   res.render("register.ejs",{check:true});
}});


app.post("/auth/register", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  login.findOne({ username: username })
      .then((user) => {
          if (user) {
              res.render("register.ejs", { check: false });
          } else {
              const newUser = new login({ username, password });
              return newUser.save().then(() => {
                  res.redirect("/auth/login");
              });
          }
      })
      .catch((error) => {
          console.error("Error registering user:", error);
          res.status(500).send("Error registering user");
      });
});


app.get("/:customListName",(req,res)=>{
  const customListName = req.params.customListName;
  const user = req.session.user;
  if(req.session.user){
    Users.findOne({username:user})
  .then((foundList)=>{
    if(!foundList){
      const list = new Users({username:user,List:{name:customListName,items:defaultItems}});
      list.save();
    }
    else{
      if (foundList && foundList.List) {
        res.render("index.ejs", {
          listTitle: foundList.List.name,
          newListItems: foundList.List.items,
          Date: currentDate
        });
      }
    }
  })
  .catch((err)=>console.log(err));
   }
   else{
    res.redirect("/auth/login");
   }
});



app.post("/delete",(req,res)=>{
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  const user = req.session.user;
  Users.findOneAndUpdate({username: user}, {$pull: {"List.items": {_id: checkedItemId}}})
    .then(() => {
      console.log("Successfully deleted checked item");
      res.redirect("/"+listName);
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send("Error deleting item");
    });
});


app.post("/",(req,res)=>{
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const task = new Task({name:itemName});
  const user = req.session.user;
    Users.findOne({username:user})
    .then((foundList)=>{
      if(task.length===0){
         res.redirect("/"+listName);
      }
      else{
          foundList.List.items.push(task);
          foundList.save();
          res.redirect("/"+listName);
      }
    })
    .catch((err)=>{console.log(err)})
});

app.get("/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/auth/login");
  });
});


app.listen(3000,()=>{console.log("listening on post 3000")});