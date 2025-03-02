const express = require('express');
const {createPost,getAllPost,getPost,deletePost} = require('../controllers/post-controller');
const {authenticateRequest} = require('../middlewares/authMiddleware');

const router = express();

router.use(authenticateRequest);

router.post('/create-post',createPost)
router.get('/getAllPost',getAllPost);
router.get('/post/:id',getPost);
router.delete('/post/:id',deletePost);

module.exports = router;