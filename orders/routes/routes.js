const Router = require('express').Router;
const router = new Router()
const Order = require('../models/orders')
const {Kafka} = require('kafkajs')

const kafka = new Kafka({brokers:['localhost:9092']})

const consumer = kafka.consumer({groupId:'order-group'})

let order


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
const run = async ()=>{
    await consumer.connect()
    await consumer.subscribe({topic:'product-order',fromBeginning:true})
    await consumer.run({
        eachMessage: async ({message})=>{
           
            const products = JSON.parse(message.value); // Deserialize message value
            console.log(products, 'log of product');
            createOrder(products);
           
        }
    })
}

run().catch(err=>console.log(err))
module.exports = router