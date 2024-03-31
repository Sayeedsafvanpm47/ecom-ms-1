const Router = require('express').Router;
const router = new Router()
const Product = require('../models/products')
const amqp = require('amqplib')
const jwt = require('jsonwebtoken')


let order, connection, channel,userdetails

// const amqpServer = `amqp://guest:guest@localhost:5672`;
const amqpServer = `amqp://production-rabbitmqcluster.default.svc.cluster.local:5672`;
         

//connect to rabbitmq
async function connectToRabbitMQ()
{
          
          connection = await amqp.connect(amqpServer)
          channel = await connection.createChannel()
          await channel.assertQueue('product-service-queue')
     
}
connectToRabbitMQ()

//authentication middleware 
const authenticate = async (req,res,next)=>{
const token = req.session.jwt 
if(!token) return res.status(401).send({message:'Not authorized'})
 jwt.verify(token,'sayeedsafvan',(err,user)=>{
  if(err)
  {
    return res.status(401).json({message:err})
  }else
  {
    req.user = user 
    next()
  }
})
}





//create a new product 

router.post('/',authenticate,async (req,res)=>{
          const {name,price,description} = await req.body 
          if(!name || !price || !description) 
          {
                    return res.status(400).json({
                              message: 'Provide name price and desc'
                    })
          }else{
          const product = await new Product({...req.body})
          await product.save()
          return res.status(201).json({
                    message:'Product created successfully',
                    product
          })
        }
})


//buy a product 
router.post('/buy', authenticate, async (req, res) => {
  try {
      const { productIds } = req.body;
      const products = await Product.find({ _id: { $in: productIds } });

      // Send order to the order-service-queue
      channel.sendToQueue('order-service-queue', Buffer.from(JSON.stringify({ products })));

      // Wait for the response from product-service-queue
      const data = await new Promise((resolve, reject) => {
          channel.consume('product-service-queue', async (data) => {
              try {
                  console.log('Consumed from product service queue');
                  const order = JSON.parse(data.content.toString());
                  channel.ack(data);
                  resolve(order);
              } catch (error) {
                  reject(error);
              }
          }, { noAck: false });
      });

      // Handle the response
      if (data) {
          return res.status(201).json({
              message: "Order placed successfully",
              order: data,
          });
      } else {
          return res.status(400).json({
              message: "Error placing order",
          });
      }
  } catch (error) {
      console.error('Error in /buy route:', error.message);
      return res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;