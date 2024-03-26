const express = require('express')
const app = express()
const PORT = process.env.PORT || 3002 
const mongoose = require('mongoose')
const {router} = require('./routes/routes')



app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use('/orders',router)

mongoose.connect('mongodb+srv://sayeedsafvan123:APKG4EOpV2x54PXl@crud-react.pzicfdq.mongodb.net/ms-demo-orders?retryWrites=true&w=majority&appName=crud-react')
 

const db_connect = mongoose.connection
db_connect.once('open',()=>{
          console.log('Database connected successfully!')
    
          app.listen(PORT,()=>{
                    console.log('Products listening to port 3002')
          })
})