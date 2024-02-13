import express from "express";
import bodyparser from "body-parser";
import mongoose from "mongoose";

const app = express();
app.use(bodyparser.urlencoded({extend:true}));
app.use(express.static("Public/Styles"));
mongoose.connect("mongodb://localhost:27017/todolist").then(()=>console.log("Connected mongodb"));

const Task = mongoose.model("Task",{name:String});
const task1 = new Task({name:"Welcome to your todolist!"});
const task2 = new Task({name:"Hit the + button to add a new item."});
const task3 = new Task({name:"<-- Hit this to delete an item."});

var today = new Date();
var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
var currentDate = today.toLocaleDateString(undefined, options);

const defaultItems = [task1,task2,task3];

const List = mongoose.model("List",{name:String,items:[{name:String}]});
const Users = mongoose.model("Users",{username:String,password:String});


app.get("/",(req,res)=>{
  res.redirect("/auth/register")
})
app.get("/auth/login",(req,res)=>{
  res.render("login.ejs",{check:true});
});
app.post("/auth/login",(req,res)=>{
   const loguser = req.body.username;
   const userpass = req.body.password;
   Users.findOne({username:loguser})
   .then((user)=>{
    if(user.password==userpass){
       res.redirect("/Today");
    }
    else{
      res.render("login.ejs",{check:false});
    }
   }
   )
});

app.get("/auth/register",(req,res)=>{
   res.render("register.ejs",{check:true});
});


app.post("/auth/register", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  Users.findOne({ username: username })
      .then((user) => {
          if (user) {
              res.render("register.ejs", { check: false });
          } else {
              const newUser = new Users({ username, password });
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
  List.findOne({name:customListName})
  .then((foundList)=>{
  if(!foundList){
    const list = new List({name:customListName,items:defaultItems});
    list.save();
  }
  else{
   res.render("index.ejs",{listTitle:foundList.name,newListItems:foundList.items,Date:currentDate});
  }
})
  .catch((err)=>console.log(err));
});


app.post("/delete",(req,res)=>
{
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
    List.findOneAndUpdate({name:listName},{$pull:{items:{_id:checkedItemId}}})
    .then(()=>{console.log("Successfully deleted checked item")})
    .catch((err)=>{console.log(err)})
    res.redirect("/"+listName);
});

app.post("/",(req,res)=>{
  const itemName = req.body.newItem;
  const listName = req.body.list;
  const task = new Task({name:itemName});
  
    List.findOne({name:listName})
    .then((foundList)=>{
      if(task.length===0){
         res.redirect("/"+listName);
      }
      else{
          foundList.items.push(task);
          foundList.save();
          res.redirect("/"+listName);
      }
    })
    .catch((err)=>{console.log(err)})
});


app.listen(3000,()=>{console.log("listening on post 3000")});