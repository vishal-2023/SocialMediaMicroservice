const Post = require('../models/Post');
const logger = require('../utils/logger');
const { publishEvent } = require('../utils/rabbitmq');
const { validatePost } = require('../utils/Validation');


async function inValidatePostCache(req, input) {
    const inputKey = `post:${input}`;
    await req.redisClient.del(inputKey);
    const keys = req.redisClient.keys('posts:*')
    if (keys.length > 0) {
        await req.redisClient.del(keys);
    }
}

const createPost = async (req, res) => {
    logger.info("create post end points hit...")

    try {
        // validate the schema..
        const { error } = validatePost(req.body);
        if (error) {
            logger.warn("Validation post error", error?.details[0]?.message)
            return res.status(400).json({
                success: false,
                message: error?.details[0]?.message,
            })
        }


        const { content, mediaIds } = req.body;
        const createNewPost = new Post({
            user: req.user.userId,
            content,
            mediaIds: mediaIds || []
        })
        await createNewPost.save();
        await publishEvent('post.created',{
            postId:createNewPost?._id.toString(),
            userId:createNewPost.user.toString(),
            content:createNewPost.content
        })
        logger.info("Post created successfully", createNewPost);
        await inValidatePostCache(req);

        res.status(201).json({
            success: true,
            message: "Post created successfully.."
        })
    } catch (err) {
        logger.error("Error creating post", err);
        res.status(500).json({
            success: false,
            message: err.message
        })
    }
}

const getAllPost = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const startIndex = (page - 1) * limit;

        const cacheKey = `posts:${page}:${limit}`;
        const cachePosts = await req.redisClient.get(cacheKey);

        if (cachePosts) {
            return res.status(200).json({
                data: JSON.parse(cachePosts)
            })
        }

        const AllPosts = await Post.find({}).sort({ createdAt: -1 }).skip(startIndex).limit(limit);
        const totalNoOfPost = await Post.countDocuments();

        const result = {
            AllPosts,
            currentPage: page,
            totalPages: Math.ceil(totalNoOfPost / limit),
            totalPosts: totalNoOfPost
        }

        // save post in redis server.
        req.redisClient.setex(cacheKey, 300, JSON.stringify(result));
        res.json(result);


    } catch (err) {
        logger.error("Error fetcing all post", err);
        res.status(500).json({
            success: false,
            message: "Error getAll post"
        })
    }
}


const getPost = async (req, res) => {
    try {
        const postId = req.params.id;
        const cacheKey = `post:${postId}`;
        const cachePost = await req.redisClient.get(cacheKey);
        if (cachePost) {
            return res.status(200).json(JSON.parse(cachePost));
        }

        const singlePostById = await Post.findById(postId);
        if (!singlePostById) {
            return res.status(404).json({
                status: false,
                message: "Post not found"
            })
        }

        await req.redisClient.setex(
            cachePost, 3600, JSON.stringify(singlePostById)
        )

    } catch (err) {
        logger.error("Error fetching post", err);
        res.status(500).json({
            success: false,
            message: "Error geting post"
        })
    }
}


const deletePost = async (req, res) => {
    try {
        const id = req.params.id;
        const deletePost = await Post.findByIdAndDelete({ _id:id });
        console.log("00000000000",deletePost);

        if (!deletePost) {
            return res.status(404).json({
                status: false,
                message: "Post Not Found.."
            })
        }
        await inValidatePostCache(req,id);

        // publish post delete method..
        await publishEvent('post.deleted', {
            postId: deletePost._id.toString(), // Use deletePost here
            userId: req.user.userId,
            mediaIds: deletePost.mediaIds // Use deletePost here as well
        });

        res.json({
            message: "Post deleted successfully",
        });
    } catch (err) {
        logger.error("Error deleting post", err);
        res.status(500).json({
            success: false,
            message: "Error deleting post"
        })
    }
}

module.exports = { createPost ,getAllPost,getPost,deletePost}