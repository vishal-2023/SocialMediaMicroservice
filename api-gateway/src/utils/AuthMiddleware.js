const logger = require('../utils/logger');
const jwt = require('jsonwebtoken');

const validateToken = (req,res,next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if(!token){
        logger.warn("Access Attempt without valid token");
        return res.status(401).json({
            message:"Authorization required..",
            sucess:false
        })
    }


    jwt.verify(token,process.env.JWTSECRET,(err,user) => {
        if(err){
            logger.warn("Invalid token")
            return res.status(429).json({
                message:"Invalid token..",
                sucess:false
            })
        }

        req.user=user
        next()
    })
}

module.exports={validateToken}