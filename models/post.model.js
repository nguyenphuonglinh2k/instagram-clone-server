const mongoose = require('mongoose');

const {ObjectId} = mongoose.Schema.Types;

const postSchema = new mongoose.Schema({
    imageUrl: {
        type: String,
        required: true
    },
    caption: {
        type: String,
        required: true
    },
    user: {
        _id: {
            type: ObjectId,
            required: true
        },
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
        }
    }
}, {
    versionKey: false
});

const Post = mongoose.model('Post', postSchema, 'posts');

module.exports = Post;