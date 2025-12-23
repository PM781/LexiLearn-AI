const router = require('express').Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// --- 1. SIGN UP ROUTE ---
router.post('/signup', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // A. Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "User already exists with that email." });
        }

        // B. Encrypt the password (Security Best Practice)
        // "Salt" is random data added to the password before hashing to make it uncrackable
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // C. Create the new user
        const newUser = new User({
            username,
            email,
            password: hashedPassword
        });

        // D. Save to MongoDB
        const savedUser = await newUser.save();

        res.json({ message: "User created successfully!", userId: savedUser._id });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error during signup." });
    }
});

// --- 2. LOGIN ROUTE ---
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // A. Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: "User not found" });
        }

        // B. Check if password matches
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        // C. Create the Digital ID Card (Token)
        const token = jwt.sign(
            { id: user._id }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1h' } // Token expires in 1 hour
        );

        // D. Send the Token and User Info back to the frontend
        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                avatarSeed: user.avatarSeed,
                totalScore: user.totalScore
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error during login." });
    }
});
// --- 3. UPDATE AVATAR ROUTE ---
router.put('/update-avatar', async (req, res) => {
    try {
        const { userId, avatarSeed } = req.body;
        
        // Find the user and update their avatarSeed
        await User.findByIdAndUpdate(userId, { avatarSeed: avatarSeed });
        
        res.json({ success: true, message: "Avatar updated!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Could not save avatar." });
    }
});
// --- 4. UPDATE SCORE ROUTE ---
router.put('/update-score', async (req, res) => {
    try {
        const { userId, score } = req.body;

        // 1. Find the user
        const user = await User.findById(userId);

        // 2. Add the new points
        user.totalScore += score;
        user.quizzesTaken += 1;

        // 3. Save to DB
        await user.save();

        res.json({ success: true, newScore: user.totalScore, quizzes: user.quizzesTaken });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Could not save score." });
    }
});

module.exports = router;