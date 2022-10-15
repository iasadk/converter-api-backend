const express = require('express');
const app = express();
const userRouter = require('./routes/user')
const uploadFileRouter = require('./routes/uploadFiles')
const fs = require('fs');
const path = require('path')
const fileUpload = require('express-fileupload');
require('dotenv').config();

app.use(fileUpload());
app.use(express.json())

// Routes middleware : 
app.use("/",userRouter);
app.use("/",uploadFileRouter);

// Port on which server is running: 
app.listen(process.env.PORT,()=>{
    console.log(`listning on PORT: ${process.env.PORT}`)
})