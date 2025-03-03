const Media = require('../models/Media');
const { uploadMediaToCloudinary } = require('../utils/cloudinary');
const logger=require('../utils/logger');

const uploadMedia = async(req,res,next) => {
    logger.info("starting a media upload file");
    try{
        if(!req.file){
            logger.warn("No file found. Please add a file and try again..");
            return res.status(400).json({
                status:false,
                message:"no file found ! please add a file & try again.."
            })
        }

        const {originalname,mimetype} = req.file;
        const userId=req.user.userId;

        logger.info(`file details: name=${originalname}, type=${mimetype}`);
        logger.info("uploading to cloudinary starting..");

        const cloundinaryUploadResult= await uploadMediaToCloudinary(req.file);
        console.log("cloud-res",cloundinaryUploadResult);
        logger.info( `cloudinary upload successfull. PublicId - ${cloundinaryUploadResult.public_id}`);

        const newlyCreatedMedia = new Media({
            publicId:cloundinaryUploadResult.public_id,
            originalName:originalname,
            mimeType:mimetype,
            url:cloundinaryUploadResult?.secure_url,
            userId
        })

        await newlyCreatedMedia.save();
        res.status(201).json({
            success:true,
            mediaId:newlyCreatedMedia._id,
            url:newlyCreatedMedia.url,
            message:"Media uploaded successfully.."
        })

    }catch(err){
        logger.warn("error in uploading media file..");
        return res.status(500).json({
            status:false,
            message:"Internal Server Error.."
        })
    }
}

module.exports ={uploadMedia}