const express= require('express')
const controllers= require("./Controllers/controllers")
const cors = require('cors');
const app = express();
const PORT = 4000;
app.use(express.json())
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.get('/', controllers.getUsers)
app.post("/register", controllers.addUser)

app.listen(PORT, ()=>{console.log(`Server listening on ${PORT}`)});