const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware')
const fs = require('fs');
const path = require('path')
const gTTS = require('gtts');
const videoshow = require('videoshow')
const { exec } = require('child_process');

// Route to upload single file (.png, .jpg, .jpeg, .mp4)
router.post("/upload_file", authMiddleware, (req, res) => {
    const { my_file: file } = req.files;
    if (file.mimetype === "video/mp4" && file.size > 200000) {
        return res.json({ error: "Max video file size is 200kbs. use this tool to compress it: https://www.onlineconverter.com/compress-video" })
    }
    else {
        if (file.mimetype === "image/jpeg" || file.mimetype === "image/png" || file.mimetype === "text/plain" || file.mimetype === "video/mp4" || file.mimetype === "audio/mp4" || file.mimetype === "audio/mpeg") {
            // Check file size is less than equals to 50kbs
            if ((file.mimetype === "image/jpeg" || file.mimetype === "image/png" || file.mimetype === "text/plain") && file.size > 50000) {
                return res.json({ error: "Max file size for  ( jpg, jpeg, png) , Text file ( txt) is 50kbs. use this tool to compress it: https://www.onlineconverter.com/" })
            }
            let { username } = req.user;
            let cwd = process.cwd();
            try {
                let file_name = file.name.split('.')[0];
                let fileExt = file.name.split('.')[1];
                let newFileName = path.resolve(cwd, process.env.ROOT_UPLOAD_PATH, username, file_name + '-' + Date.now() + '.' + fileExt)
                file.mv(path.resolve(cwd, process.env.ROOT_UPLOAD_PATH, username, newFileName), (err) => {
                    if (err) {
                        return res.json({ error: err });
                    }
                    return res.json({ status: "ok", "file_path": path.resolve(cwd, process.env.ROOT_UPLOAD_PATH, username) })
                })
            } catch (error) {
                return res.json({ error: error })

            }

        } else {
            return res.json({ error: "File type not applicable for upload. Valid files to upload are: ( jpg, jpeg, png) , Text file ( txt), video (.mp4)" })
        }

    }

})
// Route to get all the file of particular storage.
router.get("/my_upload_file", authMiddleware, (req, res) => {
    let { username } = req.user;
    let cwd = process.cwd();

    fs.readdir(path.resolve(cwd, process.env.ROOT_UPLOAD_PATH, username), (err, files) => {
        if (err) {
            return res.json({ error: err });
        }
        return res.json({ status: "ok", data: files })
    })
})
// Route to convert text file to audio: 
router.post("/text_file_to_audio", authMiddleware, (req, res) => {
    let { file_path } = req.body;
    // getting file name from given filePath
    let file_name = file_path.split('/')[2];
    // then check whether the file exist in storage or not
    let { username } = req.user;
    let cwd = process.cwd();
    let isConverted = false;
    fs.readdir(path.resolve(cwd, process.env.ROOT_UPLOAD_PATH, username), (err, data) => {
        if (err) {
            return res.json({ error: err });

        }
        let foundedFile = data.filter(f => {
            return f === file_name
        })
        if (foundedFile.length > 0 && file_name.split('.')[1] == "txt") {
            fs.readFile(path.resolve(cwd, process.env.ROOT_UPLOAD_PATH, username, file_name), 'utf8', function (err, data) {
                console.log("error:", err)
                if (err) {
                    return res.json({ error: err })
                }
                if (data) {
                    const gtts = new gTTS(data, 'en')
                    file_name = file_name.split('.')[0];
                    let newFileName = path.resolve(cwd, process.env.ROOT_UPLOAD_PATH, username, file_name + '-' + Date.now() + '.mp3')
                    gtts.save(newFileName, (err, result) => {
                        if (err) {
                            return res.json({ error: err })
                        }
                        console.log(result)
                        return res.json({ status: "ok", message: "text to audio converted", file_path: newFileName })
                    })
                }
                else {
                    return res.json({ error: "No text in your given .txt file. Upload file with some text data." })
                }

            });
        }
        else {
            return res.json({ error: "No such .txt file exist in your storage" })

        }
    });

})

// Route to merge image and audio : 
router.post("/merge_image_and_audio", authMiddleware, (req, res) => {
    const { image_file_path, audio_file_path } = req.body;
    let imageName = image_file_path.split('/')[2];
    let audioName = audio_file_path.split('/')[2];
    let { username } = req.user;
    let cwd = process.cwd();
    fs.readdir(path.resolve(cwd, process.env.ROOT_UPLOAD_PATH, username), (err, files) => {
        let imageFile = [];
        let audioFile = [];

        imageFile = files.filter(file => file === imageName);
        audioFile = files.filter(file => file === audioName);
        if (imageFile.length == 0) {
            return res.json({ error: "No such image file exist in your storage." })
        }
        else if (audioFile.length == 0) {
            return res.json({ error: "No such audio file exist in your storage." })
        }
        // If both img and audio file existing in user storage then merge both the files
        var images = [
            { path: path.resolve(cwd, 'public', 'uploads', 'Asad', imageFile[0]) },
        ]

        var videoOptions = {
            fps: 25,
            loop: 20, // seconds
            transition: true,
            // transitionDuration: 5, // seconds
            videoBitrate: 1024,
            videoCodec: 'libx264',
            size: '640x?',
            audioBitrate: '128k',
            audioChannels: 2,
            format: 'mp4',
            pixelFormat: 'yuv420p'
        }
        imageName = imageName.split('.')[0];
        audioName = audioName.split('.')[0];
        const saveFileName = `${imageName}_${audioName}_${Date.now()}.mp4`
        let saveVideoFilePath = path.resolve(cwd, 'public', 'uploads', username, saveFileName)
        videoshow(images, videoOptions)
            .audio(path.resolve(cwd, 'public', 'uploads', username, audioFile[0]))
            .save(saveVideoFilePath)
            .on('start', function (command) {
                // console.log('ffmpeg process started:', command)
            })
            .on('error', function (err, stdout, stderr) {
                return res.json({ error: err, ffmpeg_stderr: stderr })
                // console.error('Error:', err)
                // console.error('ffmpeg stderr:', stderr)
            })
            .on('end', function (output) {
                // console.error('Video created in:', output)
                return res.json({
                    status: "ok",
                    "message": "Video Created Successfully",
                    "video_file_path": `public/upload/${username}/${saveFileName}`
                })
            })
        // res.send({imageFile,audioFile})
    })
    // res.send({ imageName, audioName })
})

// Route to replace audio from an uploaded video file : 
router.post('/merge_video_and_audio', authMiddleware, (req, res) => {
    const { video_file_path, audio_file_path } = req.body;
    let videoName = video_file_path.split('/')[2];
    let audioName = audio_file_path.split('/')[2];
    let { username } = req.user;
    let cwd = process.cwd();
    fs.readdir(path.resolve(cwd, process.env.ROOT_UPLOAD_PATH, username), (err, files) => {
        let videoFile = [];
        let audioFile = [];

        videoFile = files.filter(file => file === videoName);
        audioFile = files.filter(file => file === audioName);
        if (videoFile.length == 0) {
            return res.json({ error: "No such video file exist in your storage." })
        }
        else if (audioFile.length == 0) {
            return res.json({ error: "No such audio file exist in your storage." })
        }
        let videoFilePath = path.resolve('public', 'uploads', username, videoName)
        let audioFilePath = path.resolve('public', 'uploads', username, audioName)
        // console.log(path.resolve('public', 'uploads', username, audioName))

        videoName = videoName.split('.')[0];
        audioName = audioName.split('.')[0];
        const saveFileName = `${videoName}_${audioName}_${Date.now()}.mp4`
        let saveVideoFilePath = path.resolve(cwd, 'public', 'uploads', username, saveFileName)
        // console.log(__dirname)
        exec(`ffmpeg -i "${videoFilePath}"  -stream_loop -1 -i "${audioFilePath}" -map 0:v -map 1:a -c copy -shortest "${saveVideoFilePath}"`, (err, stderr, setdout) => {
            if (err) {
                return res.json({ error: err, ffmpeg_stderr: stderr })

            }
            else {
                return res.json({
                    "status": "ok",
                    "message": "Video and Audio Merged Successfully",
                    "video_file_path": saveVideoFilePath

                })
            }
        })
    })
})

// Router to merge multiple videos from user storage: 
router.post('/merge_all_video', authMiddleware, (req, res) => {
    const { path_list } = req.body;
    let cwd = process.cwd();
    let { username } = req.user;
    // first check that all the file have .mp4 extention and while checking add their name to temp.txt file:
    let tempTextFilePath = path.resolve(cwd, process.env.ROOT_UPLOAD_PATH, username);
    let tempFile = path.join(tempTextFilePath, 'temp.txt');
    path_list.forEach(path => {
        let fileName = path.split('/')[2];
        let fileExt = fileName.split('.')[1];
        let data = `file '${fileName}'\n`

        fs.appendFile(tempFile, data, (err) => {
            if (err) return res.json({ error: err })
        })
        if (fileExt != "mp4") {
            fs.unlink(tempFile, (err) => {
                if (err) return res.json({ error: err })
            })
            return res.json({ error: `file: ${fileName} is not an .mp4 file. Only .mp4 file are allowed.` })
        }
    })
    let outputFileName = `mergeVideos-${Date.now()}.mp4`
    let outputFilePath = path.resolve(cwd, process.env.ROOT_UPLOAD_PATH, username, outputFileName);
    exec(`ffmpeg -f concat -i "${tempFile}" -c copy "${outputFilePath}"`, (err) => {
        if (err) return res.json({ error: err, ffmpeg_stderr: stderr });
        else {
            // After mergin all the videos delete the temp.txt file : 
            fs.unlink(tempFile, (err) => {
                if (err) return res.json({ error: err })
            })
            return res.json({
                "status": "ok",
                "message": "Merged All Video Successfully",
                "video_file_path": outputFilePath
            })

        }
    })



})


// route to download a file: 
router.get('/download_file', authMiddleware, (req, res) => {
    const { file_path } = req.query;
    const { username } = req.user
    let fileName = file_path.split('/')[2];
    let cwd = process.cwd();
    // check if file exist or not: 
    // console.log(fileName)
    fs.readdir(path.resolve(cwd, process.env.ROOT_UPLOAD_PATH, username), (err, files) => {
        let isFile = [];
        isFile = files.filter((f) => {
            return f === fileName
        })
        if (isFile.length === 0) {
            return res.json({ error: `${fileName} no exist in your storage.` })

        }
    })

    let downloadPath = path.resolve(cwd, process.env.ROOT_UPLOAD_PATH, username, fileName)
    return res.download(downloadPath);

    // console.log(fileName)
})
module.exports = router