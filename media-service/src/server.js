const express = require('express');
const dbConnect = require('./database/db')
const helmet = require('helmet');
const cors = require('cors');
const logger = require('./utils/logger');
const { RateLimiterRedis } = require('rate-limiter-flexible');
const Redis = require('ioredis')
// const { rateLimit } = require('express-rate-limit');
const routes = require('./routes/media-routes');
const errorHandler = require('./middlewares/errorHandlers');
const { connectToRabbitMQ, consumeEvent } = require('./utils/rabbitmq');
const { handlePostDeleted } = require('./eventHandler/media-event-handler');
require('dotenv').config();

const app = express();
dbConnect();
const PORT = process.env.PORT || 3003;

app.use(helmet());
app.use(cors())
app.use(express.json());

app.use((req, res, next) => {
    logger.info(`Recieved ${req.method} request to ${req.url}`);
    logger.info(`Request body, ${req.body}`);
    next();
})

const redisClient = new Redis(process.env.REDIS_URI);

// DDos protection & rate limiting
const rateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'middleware-media',
    points: 20, // 10 requests
    duration: 1, // per 1 second by IP

});

app.use((req, res, next) => {
    rateLimiter.consume(req.ip)
        .then(() => {
            next();
        })
        .catch(() => {
            logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
            res.status(429).json({ success: false, message: 'Too Many Requests' });
        });
})

app.use('/api/media',(req,res,next) => {
    req.redisClient=redisClient
    next()
},routes)

app.use(errorHandler)

async function startServer(){
    try{
        await connectToRabbitMQ();

        //consume all events...
        await consumeEvent('post.deleted',handlePostDeleted)
        

        app.listen(PORT,() => {
            logger.info(`Media Service running on port ${PORT}`)
        })
        
    }catch(err){
        logger.error("failed to connect server");
        process.exit(1);
    }
}

startServer();


// unhandled promise
process.on('unhandledRejection',((reason,promise) => {
    logger.error('Unhandled Rejection at',promise,"reason",reason)
}))