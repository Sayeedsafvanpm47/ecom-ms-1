const Router = require('express').Router;
const router = new Router()
const Product = require('../models/products')
const amqp = require('amqplib')


let order, connection, channel 

const amqpServer = `amqp://guest:guest@localhost:5672`;

//connect to rabbitmq
async function connectToRabbitMQ()
{
          // const amqpServer = `amqp://production-rabbitmqcluster.default.svc.cluster.local:5672`;
         
          connection = await amqp.connect(amqpServer)
          channel = await connection.createChannel()
          await channel.assertQueue('product-service-queue')
          await channel.assertQueue('auth-service-queue')
}
connectToRabbitMQ()


const authenticate = async (req, res, next) => {
  try {
  
    const token = req.session.jwt; 

    if (!token) {
      return res.status(401).json({ message: 'User not authorized, missing jwt token!' });
    }

    const response = await sendToken(token);
    console.log(response, 'inside authenticate');

    if (response !== null) { // Check for explicit success property
      next();
    } else {
      return res.status(401).json({ message: 'Not authorized' });
    }
  } catch (error) {
    console.error('Error authenticating user:', error.message);
    // Provide more specific error messages to client if possible (e.g., "Invalid JWT" or "AuthService unavailable")
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

const sendToken = async (token) => {
  return new Promise((resolve, reject) => {
    channel.sendToQueue('auth-service-queue', Buffer.from(JSON.stringify({ token })));
    channel.consume('product-service-queue', async (data) => {
      try {
        const response = await JSON.parse(data.content.toString());
        console.log(response, 'response after sign in');
        channel.ack(data);
        resolve(response);
      } catch (error) {
        console.error('Error parsing response:', error.message);
        reject(error);
      }
    });
  });
};

// const sendTokenToCustomer = async (token) => {
//   try {
//     const connection = await amqp.connect(amqpServer);
//     const channel = await connection.createChannel();
//     await channel.assertQueue('auth-service-queue');
    
//     // Create a promise to wait for the authentication response
//     const responsePromise = new Promise((resolve, reject) => {
//       const responseQueue = 'response-queue-' + Math.random().toString(36).substring(7);
//       channel.assertQueue(responseQueue, { exclusive: true });
      
//       // Set up consumer to listen for response from the customer service
//       channel.consume(responseQueue, (msg) => {
//         const response = JSON.parse(msg.content.toString());
//         console.log('Received authentication response:', response);
        
//         // Close the channel and connection after receiving the response
//         channel.close();
//         connection.close();
        
//         // Resolve the promise with the authentication status
//         resolve(response.isAuthenticated);
//       }, { noAck: true });

//       // Send the token to the customer service for verification
//       channel.sendToQueue('auth-service-queue', Buffer.from(JSON.stringify({ token, responseQueue })));
//     });

//     // Wait for the response and return the authentication status
//     return await responsePromise;
//   } catch (error) {
//     console.error('Error sending token to customer service:', error.message);
//     return false; // Return false in case of error
//   }
// }


//create a new product 

router.post('/',authenticate,async(req,res)=>{
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
          const response = await channel.consume('product-service-queue',data => {
                    console.log('Consumed from product service queue')
                    order = JSON.parse(data.content)
                    channel.ack(data)
          })
         
          if(order!==undefined)
          {
            return res.status(201).json({
              message: "Order placed successfully",
              order,
            });
          }else
           {
            return res.status(400).json({
              message: "Error placing order",
             
            });
          }
         
})

module.exports = router;