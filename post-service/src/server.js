const express = require('express');
const dbConnect = require('./database/db')
const helmet = require('helmet');
const cors = require('cors');
const logger = require('./utils/logger');
const { RateLimiterRedis } = require('rate-limiter-flexible');
const Redis = require('ioredis')
// const { rateLimit } = require('express-rate-limit');
const routes = require('./routes/Post-routes');
const errorHandler = require('./middlewares/errorHandlers');
const { connectToRabbitMQ } = require('./utils/rabbitmq');
require('dotenv').config();

const app = express();
dbConnect();
const PORT = process.env.PORT || 3002;

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
    keyPrefix: 'middleware-post',
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

app.use('/api/posts',(req,res,next) => {
    req.redisClient=redisClient
    next()
},routes)

app.use(errorHandler)

async function startServer(){
    try{
        await connectToRabbitMQ();
        app.listen(PORT,() => {
            logger.info(`Post Service running on port ${PORT}`)
        })
    }catch(err){
        logger.error("Failed to connect to server",err);
        process.exit(1);
    }
}

startServer()

// unhandled promise
process.on('unhandledRejection',((reason,promise) => {
    logger.error('Unhandled Rejection at',promise,"reason",reason)
}))