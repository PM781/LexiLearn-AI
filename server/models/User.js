const mongoose = require('mongoose');

// This defines the "Shape" of a user in our database
const userSchema = new mongoose.Schema({
    username: { 
        type: String, 
        required: true 
    },
    email: { 
        type: String, 
        required: true, 
        unique: true  // No two users can share an email
    },
    password: { 
        type: String, 
        required: true 
    },
    
    // --- GAME STATS ---
    avatarSeed: { 
        type: String, 
        default: "Felix" // Everyone starts as "Felix"
    },
    totalScore: { 
        type: Number, 
        default: 0 
    },
    quizzesTaken: { 
        type: Number, 
        default: 0 
    },
    
    // Auto-record when they joined
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('User', userSchema);