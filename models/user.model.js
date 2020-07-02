const mongoose = require('mongoose');

const {ObjectId} = mongoose.Schema.Types;

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    userImageUrl: {
        type: String,
        required: true
    },
    followers: [
       ObjectId 
    ],
    following: [
        ObjectId 
     ]
}, {
    versionKey: false
});

const User = mongoose.model('User', userSchema, 'users');

module.exports = User;