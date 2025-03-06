const logger = require('../utils/logger');
const Search = require('../models/Search')

const searchPostController = async(req,res) => {
    logger.info('Searc endpoint hit..');

    try{
        const {query} = req.query;
        const result = await Search.find({
            $text:{$search:query},
        },{
            score:{$meta:"textScore"}
        }).sort({ score:{$meta:"textScore"}})
        .limit(10);

        return res.status(200).json({
            status:true,
            data:result
        })
    }catch(err){
        logger.error("Error while creating post",err);
        res.status(500).json({
            status:false,
            message:"Error while searching post.."
        })
    }
}


module.exports = {searchPostController}