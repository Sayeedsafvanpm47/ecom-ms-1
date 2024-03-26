const express = require('express')
const app = express()
const PORT = process.env.PORT || 3001;
const mongoose = require('mongoose')
const productRouter = require('./routes/routes')
const cookieSession = require('cookie-session')
const cookieParser = require('cookie-parser')
const {authenticate} = require('./routes/routes')

app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(cookieParser())
app.use(cookieSession({
          name:'session',
          signed:false,
          secured:false
}))
app.use('/products',productRouter)

mongoose.connect('mongodb+srv://sayeedsafvan123:APKG4EOpV2x54PXl@crud-react.pzicfdq.mongodb.net/ms-demo-products?retryWrites=true&w=majority&appName=crud-react')
const db_connect = mongoose.connection
db_connect.once('open',()=>{
          console.log('Database connected successfully!')
          app.listen(PORT,()=>{
                    console.log('Products listening to port 3001')
          })
})