const express = require('express');
const {searchPostController} = require('../controllers/search-controller');
const {authenticateRequest} = require('../middlewares/authMiddleware');

const router = express();

router.use(authenticateRequest);

router.get('/posts',searchPostController)


module.exports = router;