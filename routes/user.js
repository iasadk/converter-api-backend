const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path')

router.post('/create_new_storage', (req, res) => {
    const { username } = req.body;
    // check if user folder is present or not :
    let cwd = process.cwd()
    let uploadsPath = path.resolve(cwd,process.env.ROOT_UPLOAD_PATH)
    fs.readdir(path.resolve(uploadsPath,username), (err, files) => {
        if (files) {
            // If foler exist return error
            return res.json({ error: "Storage already exists" });
        } else {
            // If new user then create storage for it : 
            const secret = process.env.secret
            let token = jwt.sign({username: username},secret);
            fs.mkdir(path.join(uploadsPath,username), (err) => {
                if (err) {

                    return res.json({ err, a: "asad" })
                }
                res.json({msg: "storage created successfully. Now you can upload your files",token})
            })

        }
    })
})
module.exports = router