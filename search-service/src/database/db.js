const mongoose = require('mongoose');
require('dotenv').config();
const logger = require('../utils/logger');


//connect to mongodb
const dbConnect = async() => {
    try{
        await mongoose.connect(process.env.MONGOURI).then(() => {
            logger.info("Connected to mongodb")
        })
    }catch(err){
        logger.error("mongo connection error",err)
    }
}

module.exports = dbConnect;