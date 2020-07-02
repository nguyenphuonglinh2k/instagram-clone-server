const express = require('express');
const router = express.Router();

const userController = require('../controllers/user.controller');
const middleware = require('../middleware/requireLogin.middleware');

router.get('/', (req, res) => {
    res.send('hello');
});

router.get('/getusers/:userId',  userController.getUser);

router.get('/getposts', middleware.requiredLogin, userController.getAllPosts);

router.get('/getcomments', middleware.requiredLogin, userController.getAllComments);

router.get('/getlikes', middleware.requiredLogin, userController.getAllLikes);

router.post('/signin', userController.postSignIn);

router.post('/signup', userController.postSignUp);

router.post('/password/reset', userController.postResetPassword);

router.post('/password/reset/update', userController.postUpdatePassword);

router.post('/post/create', middleware.requiredLogin, userController.postCreateMyPost);

router.post('/post/action', middleware.requiredLogin, userController.postActionLike);

router.post('/post/comment', middleware.requiredLogin, userController.postComment);

router.put('/follow', middleware.requiredLogin, userController.follow);

module.exports = router;