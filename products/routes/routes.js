const Router = require('express').Router;
const router = new Router()
const Product = require('../models/products')
const amqp = require('amqplib')
const jwt = require('jsonwebtoken')
const {Kafka} = require('kafkajs')

const kafka = new Kafka({brokers:['localhost:9092']})

const producer = kafka.producer()



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
      console.log(products)

      await producer.connect()
      await producer.send({
        topic:'product-order',
        messages: [{ value: JSON.stringify(products) }] 
      })

      await producer.disconnect()
      res.send(`Purchase made`)
     
  } catch (error) {
      console.error('Error in /buy route:', error.message);
      return res.status(500).json({ message: 'Internal Server Error' });
  }
});

module.exports = router;