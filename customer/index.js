const express = require('express')

const app = express()

app.get('/customer',(req,res)=>{
          res.status(200).send({message:'Welcome to Customer page'})
})

app.listen(3000,()=>{
          console.log('Customer listening to 3000')
})