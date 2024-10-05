const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const mentor_routes = require("./routes/mentorRoutes");
const student_routes = require("./routes/studentRoutes")
const cors = require("cors")

//Load the dotenv values
dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log("MongoDB Connected Successfully")
}).catch((error)=>{
    console.log(`MongoDB Connection Failed \b ${error}`)
})

//Checking for which URI
console.log(`MONGO_URI - ${process.env.MONGO_URI}`)

app.use('/mentor', mentor_routes)
app.use('/student', student_routes)

const PORT = process.env.PORT;
app.listen(PORT,()=>{
    console.log(`Server Running on Port - ${PORT}`)
}) 