const amqp = require('amqplib');
const logger=require('./logger');

let connection=null;
let channel=null;

const EXCHANGE_NAME= 'social_media'

async function connectToRabbitMQ(){
    try{
        connection= await amqp.connect(process.env.RABBITMQ_URL);
        channel= await connection.createChannel();
        await channel.assertExchange(EXCHANGE_NAME,"topic",{durable:false});
        logger.info("connected to rabbit Mq");
    }catch(err){
        logger.error("Error connecting to rabbitMq ",err);
    }
}


module.exports={connectToRabbitMQ}