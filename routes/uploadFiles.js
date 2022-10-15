const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware')
const fs = require('fs');
const path = require('path')
const gTTS = require('gtts');

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
        if (foundedFile.length > 0 && file_name.split('.')[1]=="txt") {
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
module.exports = router