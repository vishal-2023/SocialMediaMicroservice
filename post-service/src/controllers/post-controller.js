const Post = require('../models/Post');
const logger = require('../utils/logger');

const createPost = async(req,res) => {
    try{
        const {content,mediaId}=req.body;
        const createNewPost= new Post({
            user:req.user.userId,
            content,
            mediaIds:mediaId||[]
        })

        await createNewPost.save();
        logger.info("Post created successfully",createNewPost);
        res.status(201).json({
            success:false,
            message:"Post created successfully.."
        })
    }catch(err){
        logger.error("Error creating post",err);
        res.status(500).json({
            success:false,
            message:"Error creating post"
        })
    }
}

const getAllPost = async(req,res) => {
    try{

    }catch(err){
        logger.error("Error fetcing all post",err);
        res.status(500).json({
            success:false,
            message:"Error getAll post"
        })
    }
}


const getPost = async(req,res) => {
    try{

    }catch(err){
        logger.error("Error fetching post",err);
        res.status(500).json({
            success:false,
            message:"Error geting post"
        })
    }
}


const deletePost = async(req,res) => {
    try{

    }catch(err){
        logger.error("Error deleting post",err);
        res.status(500).json({
            success:false,
            message:"Error deleting post"
        })
    }
}

module.exports = {createPost}