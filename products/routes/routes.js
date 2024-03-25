const Router = require('express').Router;
const router = new Router()
const Product = require('../models/products')
const amqp = require('amqplib')

let order, connection, channel 

//connect to rabbitmq
async function connectToRabbitMQ()
{
          const amqpServer = `amqp://production-rabbitmqcluster.default.svc.cluster.local:5672`;
          connection = await amqp.connect(amqpServer)
          channel = await connection.createChannel()
          await channel.assertQueue('product-service-queue')
}
connectToRabbitMQ()

//create a new product 

router.post('/',async(req,res)=>{
          const {name,price,description} = req.body 
          if(!name || !price || !description) 
          {
                    return res.status(400).json({
                              message: 'Provide name price and desc'
                    })
          }
          const product = await new Product({...req.body})
          await product.save()
          return res.status(201).json({
                    message:'Product created successfully',
                    product
          })
})

//buy a product 
router.post('/buy',async(req,res)=>{
          const {productIds} = req.body 
          const products = await Product.find({_id:{$in:productIds}})
          //send order to rabbimq order queue
          channel.sendToQueue('order-service-queue',Buffer.from(JSON.stringify({products})))
          //consume previously placed order from rabbit mq and acknowledge transaction
          channel.consume('product-service-queue',data => {
                    console.log('Consumed from product service queue')
                    order = JSON.parse(data.content)
                    channel.ack(data)
          })
          return res.status(201).json({
                    message: "Order placed successfully",
                    order,
                  });
})
module.exports = router;