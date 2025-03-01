const express = require('express');
const dbConnect = require('./database/db')
const helmet = require('helmet');
const cors = require('cors');
const logger = require('./utils/logger');
const { RateLimiterRedis } = require('rate-limiter-flexible');
const Redis = require('ioredis')
const { rateLimit } = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis')
const routes = require('./routes/identity-service');
const errorHandler = require('./middlewares/errorHandlers');

dbConnect();
const app = express();

//middleware
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
    keyPrefix: 'middleware',
    points: 10, // 10 requests
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

const sesitiveEndspointsLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
    standardHeaders: 'draft-8', // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
    handler:(req,res) => {
        logger.warn(`Sesitive endspoint rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            success:false,message:"Too many request"
        })
    },
    store: new RedisStore({
        sendCommand:(...args) => redisClient.call(...args)
    })
})

// applysesitiveEndspointsLimiter middleware on my sensitive endpoints..

app.use('/api/auth/register',sesitiveEndspointsLimiter);

//Routes
app.use('/api/auth',routes)

app.use(errorHandler)

const PORT = process.env.PORT || 3001

app.listen(PORT,() => {
    logger.info(`Identity Service running on PORT ${PORT}`)
})

// unhandled promises rejection..
process.on('unhandledRejection',((reason,promise) => {
    logger.error('Unhandled Rejection at',promise,"reason",reason)
}))