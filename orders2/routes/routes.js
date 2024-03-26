const {Kafka} = require('kafkajs')
const { Router } = require('express');
const Order = require('../models/orders');

const router = Router();

const kafka = new Kafka({ brokers: ['192.168.1.10:9092'] });
const consumer = kafka.consumer({ groupId: 'orders-group' });


let order;

let createOrder = (products) => {
    let total = 0;
    products.forEach((product) => {
        total += product.price;
    });
    order = new Order({
        products,
        total
    });
    order.save();
    return order;
};

const run = async () => {
    console.log('Connecting to Kafka...');
    try {
        await consumer.connect();
        await consumer.subscribe({ topic: 'order-new', fromBeginning: true });
        await consumer.run({
            eachMessage: async ({ message }) => {
                const products = JSON.parse(message.value);
                console.log(products, 'log of product');
                createOrder(products);
            }
        });
        console.log('Connected to Kafka.');
    } catch (error) {
        console.error('Error connecting to Kafka:', error);
    }
};
run().catch((err)=>console.log(err))
module.exports = { router, run };
