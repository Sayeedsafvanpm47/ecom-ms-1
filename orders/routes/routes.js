const Router = require('express').Router;
const router = new Router()
const Order = require('../models/orders')
const amqp = require('amqplib')

let order,connection, channel 

async function connectToRabbitMQ() {
          try {
              const amqpServer = `amqp://guest:guest@production-rabbitmqcluster.default.svc.cluster.local:5672`;
          //     const amqpServer = `amqp://guest:guest@localhost:5672`;
              connection = await amqp.connect(amqpServer);
              channel = await connection.createChannel();
              await channel.assertQueue('order-service-queue');
              console.log('Connected to RabbitMQ');
              return true;
          } catch (error) {
              console.error('Error connecting to RabbitMQ:', error.message);
              return false;
          }
        }
 connectToRabbitMQ()
        let createOrder = (products)=>{
          let total = 0;
          products.forEach((product)=>{
                    total += product.price
          })
          order = new Order({
                    products,total
          })
          order.save()
          return order
}

(async () => {
          const connected = await connectToRabbitMQ();
          if (connected) {
              channel.consume('order-service-queue', (data) => {
                  console.log(data);
                  console.log(data.content);
                  const { products } = JSON.parse(data.content);
                  const newOrder = createOrder(products);
                  console.log(newOrder);
                  channel.ack(data);
                  channel.sendToQueue('product-service-queue', Buffer.from(JSON.stringify(newOrder)));
                  console.log('order sent');
              });
          } else {
              // Handle connection error
              console.error('Cannot consume messages from RabbitMQ due to connection error.');
          }
        })();
module.exports = router