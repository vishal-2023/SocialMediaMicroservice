const logger = require('../utils/logger');

const authenticateRequest = async(req,res,next) => {
    const userId = req.headers['x-user-id']

    if(!userId){
        logger.warn('Access attempted without userId');
        return res.status(401).json({
            status:false,
            message:"Authentication required || Please Login to continue.."
        })
    }
    req.user = {userId};
    next()
}

module.exports = authenticateRequest