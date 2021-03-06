const express = require("express");
const router = express.Router();
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("passport");

const keys = require("../../config/keys");
const User = require("../../models/User");

// @routes  GET api/users/test
// @desc    Tests users routes
// @access  Public
router.get("/test", (req, res) => {
    res.json({
        msg: "Users works"
    });
});

// @routes  POST api/users/test
// @desc    Register user
// @access  Public
router.post("/register", (req, res) => {
    User.findOne({ email: req.body.email }).then(user => {
        if (user)
            // If user exists
            return res.status(400).json({ email: "Email already exists" });
        else {
            const avatar = gravatar.url(req.body.email, {
                s: "200", // Size
                r: "pg", // Rating
                d: "mm" // Default
            });

            const newUser = new User({
                name: req.body.name,
                email: req.body.email,
                avatar, // ES6 - equals to "avatar: avatar,"
                password: req.body.password
            });

            bcrypt.genSalt(10, (err, salt) => {
                bcrypt.hash(newUser.password, salt, (err, hash) => {
                    if (err) throw err;
                    newUser.password = hash;
                    newUser
                        .save()
                        .then(user => {
                            res.json(user);
                            console.log(`Add user ${newUser.name} to db`);
                        })
                        .catch(err => console.log(err));
                });
            });
        }
    });
});

// @routes  GET api/users/login
// @desc    Login user / Returning JWT token
// @access  Public

router.post("/login", (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    // Find user by emaim
    User.findOne({ email }).then(user => {
        // Check for user
        if (!user) return res.status(404).json({ email: "User not found" });

        // Check password
        bcrypt.compare(password, user.password).then(isMatch => {
            if (isMatch) {
                // User matched
                // Create JWT Payload
                const payload = {
                    id: user.id,
                    name: user.name,
                    avatar: user.avatar
                };
                // Sign token
                jwt.sign(
                    payload,
                    keys.secretOrKey,
                    { expiresIn: 3600 },
                    (err, token) => {
                        res.json({
                            success: true,
                            token: "Bearer " + token
                        });
                    }
                );
            } else {
                return res.status(400).json({ password: "Password incorrect" });
            }
        });
    });
});

// @routes  GET api/users/users/current
// @desc    Return current user
// @access  Private

router.get(
    "/current",
    passport.authenticate("jwt", { session: false }),
    (req, res) => {
        res.json({
            id: req.user.id,
            name: req.user.name,
            email: req.user.email
        });
    }
);

module.exports = router;
