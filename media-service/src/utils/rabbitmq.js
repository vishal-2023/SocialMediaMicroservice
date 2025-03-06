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

async function publishEvent(routingKey,message){
    if(!channel){
        await connectToRabbitMQ();
    }
    
    channel.publish(EXCHANGE_NAME,routingKey,Buffer.from(JSON.stringify(message)));
    logger.info(`Event Published: ${routingKey}`);

}

async function consumeEvent(routingKey,callback) {
    if(!channel){
        await connectToRabbitMQ();
    }

    const q = await channel.assertQueue("",{exclusive:true});
    await channel.bindQueue(q.queue,EXCHANGE_NAME,routingKey);

    channel.consume(q.queue,(msq) => {
        if(msq !== null){
            const content = JSON.parse(msq.content.toString());
            callback(content);
            channel.ack(msq);
        }
    })

    logger.info(`Subscribe to event: ${routingKey}`)
}

module.exports={connectToRabbitMQ,publishEvent,consumeEvent}