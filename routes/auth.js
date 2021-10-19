const express = require('express');
const User = require('../models/User');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
var fetchuser = require('../middleware/fetchuser')
// const JWT_SECRET = process.env.JWT_SECRET_TOKEN;
const JWT_SECRET = "Namanisahumble@person";

// ROUTE 1 : Create a User using : POST "/api/auth/createuser". No login required

router.post('/createuser', [
    body('name', 'Enter a valid name').isLength({ min: 3 }),
    body('email', 'Enter a valid email').isEmail(),
    body('password', 'Password must be atleast 6 characters.').isLength({ min: 6 }),],
    async (req, res) => {
        // if there are errors return the bad request and corresponding errors.
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            // Check whether the user with this email exists already
            let user = await User.findOne({ email: req.body.email });
            if (user) {
                return res.status(400).json({ error: "User with this email already exists." })
            }
            // Created a salt for secured password
            const salt = await bcrypt.genSalt(10);
            const securePassword = await bcrypt.hash(req.body.password, salt);
            // Create new user
            user = await User.create({
                name: req.body.name,
                email: req.body.email,
                password: securePassword
            });
            const data = {
                user: {
                    id: user.id
                }
            }
            const authtoken = jwt.sign(data, JWT_SECRET);
            res.json({ authtoken });
        }
        catch (error) {
            console.log(error.message);
            res.status(500).send("Some error occured");
        }
    })


// ROUTE 2 : Authenticate a User using : POST "/api/auth/login". No login required

router.post('/login', [
    body('email', 'Enter a valid email').isEmail(),
    body('password', 'Password must be atleast 6 characters.').isLength({ min: 6 }),],
    async (req, res) => {
        // if there are errors return the bad request and corresponding errors.
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { email, password } = req.body;
        try {
            let user = await User.findOne({ email });
            if (!user) {
                return res.status(400).json({ error: "Login credentials are invalid !" });
            }

            const passwordCompare = await bcrypt.compare(password, user.password);
            if (passwordCompare === false) {
                return res.status(400).json({ error: "Login credentials are invalid !" });
            }

            const data = {
                user: {
                    id: user.id
                }
            }
            const authtoken = jwt.sign(data, JWT_SECRET);
            res.json({ authtoken });
        } catch (error) {
            console.log(error.message);
            res.status(500).send("Internal Server Error");
        }
    })


// ROUTE 3 : Logged User Details using : POST "/api/auth/getuser". Login required

router.post('/getuser', fetchuser, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).select("-password");
        res.send(user);
    }
    catch (error) {
        console.log(error.message);
        res.status(500).send("Internal Server Error");
    }
})
module.exports = router;