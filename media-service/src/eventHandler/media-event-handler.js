const Media = require("../models/Media");
const { deleteMediaFromCloudinary } = require("../utils/cloudinary");
const logger = require("../utils/logger");


const handlePostDeleted = async(event) => {
    console.log("event-manage",event);
    const {postId,mediaIds} = event;
    try{
        const mediaToDeleted = await Media.find({_id:{$in: mediaIds}});
        for(const media of mediaToDeleted){
            await deleteMediaFromCloudinary(media.publicId);
            await Media.findByIdAndDelete(media._id);

            logger.info(`Deleted Media ${media._id} from Post ${postId}`)
        }
    }catch(err){
        logger.error(e,"Error occured while media deletion..")
    }
}

module.exports = {handlePostDeleted}