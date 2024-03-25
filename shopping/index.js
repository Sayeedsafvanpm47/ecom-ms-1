const express = require('express')

const app = express()

app.get('/shopping',(req,res)=>{
          res.status(200).send({message:'Welcome to shopping page'})
})

app.listen(3000,()=>{
          console.log('Shopping listening to 3000')
})