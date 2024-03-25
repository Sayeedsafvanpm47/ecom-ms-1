const Router = require('express').Router
const router = new Router()
const User = require('../models/user')
const jwt = require('jsonwebtoken')
const amqp = require('amqplib')

let connection, channel;

const verifyToken = async (token) => {
          try {
              
              const decoded = await jwt.verify(token, 'sayeedsafvan'); 
      
             
              return decoded;
          } catch (error) {
            
              console.error('Error verifying JWT token:', error.message);
              return null;
          }
      };

      async function connectToRabbitMQ() {
          try {
          //     const amqpServer = `amqp://guest:guest@production-rabbitmqcluster.default.svc.cluster.local:5672`;
              const amqpServer = `amqp://guest:guest@localhost:5672`;
              connection = await amqp.connect(amqpServer);
              channel = await connection.createChannel();
              await channel.assertQueue('auth-service-queue');
              console.log('Connected to RabbitMQ');
              return true;
          } catch (error) {
              console.error('Error connecting to RabbitMQ:', error.message);
              return false;
          }
        }
 connectToRabbitMQ()
     

const connect = async () => {
          const connected = await connectToRabbitMQ();
          if (connected) {
              channel.consume('auth-service-queue',async (data) => {
                  console.log(data);
                  console.log(data.content);
                  const { token } = JSON.parse(data.content);
                  
                  const decoded = await verifyToken(token)


                  console.log(decoded);
                  channel.ack(data);
                  channel.sendToQueue('product-service-queue', Buffer.from(JSON.stringify(decoded)));
                  console.log('Authorized');
              });
          } else {
              // Handle connection error
              console.error('Cannot consume messages from RabbitMQ due to connection error.');
          }
        }

router.post('/signout',async(req,res)=>{
          req.session = null 
          return res.status(200).send({"message":"user signed out successfully!"})
})
connect()


router.post('/signup',async (req,res)=>{
          const {email,password} = req.body 
          if(!email ||!password) return console.log('Enter email and password')
           const user = await new User({email,password})
          await user.save()
          const userJWT = jwt.sign({
                    id:user._id,
                    email:user.email
          },'sayeedsafvan')
          req.session = {
                    jwt: userJWT 
          }
          return res.status(201).send(user)

})
router.post('/signin',async (req,res)=>{
const {email,password} = req.body 
const user = await User.findOne({email})
if(user.password == password)
{
          const userJWT = jwt.sign({
                    id:user._id,
                    email:user.email
          },'sayeedsafvan')
          req.session = {
                    jwt: userJWT 
          }
          return res.status(200).send({message:'Log in success!'})
}
})

module.exports = router