const express = require('express');
const app = express();
require('dotenv').config()
const userRouter = require('./routes/user')
const uploadFileRouter = require('./routes/uploadFiles')
// const fs = require('fs');
const path = require('path')
const fileUpload = require('express-fileupload');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = require('@ffprobe-installer/ffprobe').path;
ffmpeg.setFfprobePath(ffprobePath);
ffmpeg.setFfmpegPath(ffmpegPath);

app.use(fileUpload());
app.use(express.json())

// Routes middleware : 
app.use("/", userRouter);
app.use("/", uploadFileRouter);

// Port on which server is running: 
app.listen(process.env.PORT, () => {
    console.log(`listning on PORT: ${process.env.PORT}`)
})