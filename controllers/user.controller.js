require('dotenv').config();

// const express = require('express')
// const app = express()
// const server = require('http').createServer(app);
// const io = require('socket.io')(server);

const bcrypt = require('bcrypt');
const sgMail = require('@sendgrid/mail');
var jwt = require('jsonwebtoken');

const User = require('../models/user.model');
const Post = require('../models/post.model');
const Like = require('../models/like.model');
const Comment = require('../models/comment.model');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

module.exports.getAllPosts = async (req, res) => {
    const allPost = await Post.find();
    res.json(allPost);
}

module.exports.getAllComments = async (req, res) => {
    const allComment = await Comment.find();
    res.json(allComment);
}

module.exports.getAllLikes = async (req, res) => {
    const allLike = await Like.find();
    res.json(allLike);
}

module.exports.getUser = async (req, res) => {
    const userId = req.params.userId;
    const user = await User.findById({ _id: userId }).select('-password');
    res.json(user);
}

module.exports.postSignIn = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.json({ error: 'Please add all the fields' });
    }

    const emailExtension = email.slice(-10);

    if (emailExtension !== '@gmail.com') 
        return res.json({ error: 'Email is invalid' });

    let user = await User.findOne({ email: email});
    
    if (!user) 
        return res.json({ error: 'Email is not exist' });

    bcrypt.compare(password, user.password, function(err, result) {
        if (!result) 
            return res.json({ error: 'Password is wrong' });

        const token = jwt.sign({
            user: user
        }, process.env.JWT_KEY, { expiresIn: '24h' });

        const { _id, email, name, userImageUrl, followers, following } = user;

        return res.json({ token:  token, user: { _id, email, name, userImageUrl, followers, following } });
    });    
};

module.exports.postSignUp = (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
       return res.json({ error: 'Please add all the fields' });
    }

    User.findOne({ email: email })
        .then(result => {
            if (result) 
                return res.json({ error: 'Email already exist'});

            const emailExtension = email.slice(-10);

            if (emailExtension !== '@gmail.com') 
                return res.json({ error: 'Email is invalid' });

            bcrypt.hash(password, 12, function(err, hash) {
                if (err) console.log(err);

                let user = new User({
                    name,
                    email,
                    password: hash,
                    userImageUrl: 'https://cdn.glitch.com/9b1d0fdf-246e-4fdd-9575-5734520b815a%2Fundraw_female_avatar_w3jk.svg?v=1591767462454'
                });
    
                user.save((err, user) => {
                    if (err) {
                        console.log(err);
                        return res.json({ error: 'Sign up is failed' });
                    }
    
                    console.log('Saved successfully');
                    return res.json({ message: 'Sign up successfully' });
                });
            }); 
        })
        .catch(err => console.log(err));
};

module.exports.postResetPassword = async (req, res) => {
    const { email } = req.body;

    if (!email) 
        return res.json({ error: 'Please filled the field'});

    const user = await User.findOne({ email: email });

    const emailExtension = email.slice(-10);

    if (emailExtension !== '@gmail.com') 
        return res.json({ error: 'Email is invalid' });

    if (!user) {
        return res.json({ error: 'Email is not exist' });
    }

    const msg = {
        to: 'nguyenphuonglinh11102000@gmail.com',
        from: 'linhphuongnguyen11102000@gmail.com',
        subject: 'Reset your password',
        html: `<strong>Here your link to reset your password: http://localhost:3000/password/reset/update/${user._id}</strong>`,
      };

    sgMail.send(msg).then(() => {
        console.log('Message sent')
    }).catch((error) => {
        console.log(error.response.body)
    });

    return res.json({ message: 'Thanks! Please check your email for a link to reset password' });
    
}

module.exports.postUpdatePassword = (req, res) => {
    const { password, userId }= req.body;

    console.log('userId: ', userId);

    if (!password) 
        return res.json({ error: 'Please filled the field'});

    bcrypt.hash(password, 12, function(err, hash) {
        if (err) console.log(err);

        User.findByIdAndUpdate({_id: userId }, { password: hash })
        .then(result => {
            if (!result)
                return res.json({ error: 'Reset password is failed'});

            res.json({ message: 'Reset password successfully'});
        })
        .catch(err => console.log(err));
    });
}

module.exports.postCreateMyPost = async (req, res) => {
    const { imageUrl, caption } = req.body;
    const user = req.user;

    if (!imageUrl || !caption)
        return res.json({ error: 'Please filled the field'});

    const newPost = new Post({
        caption,
        imageUrl,
        user: user
    }); 

    newPost.save((err, newPost) => {
        if (err) {
            console.log(err);
            return res.json({ error: 'Create post is failed' });
        }

        console.log('Saved successfully');
        return res.json({ message: 'Created post successfully' });
    });    
}

module.exports.postActionLike = async (req, res) => {
    const user = req.user;
    const { postId } = req.body;

    const actionLike = await Like.findOne({ postId: postId, userId: user._id });

    if (!actionLike) {
        const newActionLike = new Like({
            postId,
            userId: user._id,
            isLiked: true
        }); 
    
        newActionLike.save(async (err, newActionLike) => {
            if (err) {
                console.log(err);
            }
        });  

        let likes = await Like.find();

        return res.json(likes);
    }

    Like.findOneAndDelete({ postId: postId, userId: user._id }).then(result => {});

    let likes = await Like.find();

    return res.json(likes);
}

module.exports.postComment = async (req, res) => {
    const user = req.user;
    const { postId, caption } = req.body;

    const comment = new Comment({
        caption,
        postId,
        user: user
    }); 

    comment.save(async (err, comment) => {
        if (err) {
            console.log(err);
        }

        let comments = await Comment.find();
        
        res.json(comments);
    }); 
}

module.exports.follow = async (req, res) => {
    const { followId } = req.body;
    const user = req.user; 

    let userExist = await User.findById({ _id: user._id});

    let isExisted = userExist.following.find(item => item == followId);

    if (!isExisted) {
        User.findByIdAndUpdate({ _id: followId }, {
            $push: {followers: user._id}
        }, {
            new: true
        }).select('-password')
        .then(result => res.json(result))
        .catch(err => res.json({error: err}));
    
        User.findByIdAndUpdate({ _id: user._id }, {
            $push: {following: followId}
        }, {
            new: true
        }, (err, result) => {
            if (err) {
                return res.json({error: err});
            }
        });
    }
}