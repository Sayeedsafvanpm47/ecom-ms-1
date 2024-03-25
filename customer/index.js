const express = require('express')

const app = express()
const PORT = process.env.PORT || 3003 
const mongoose = require('mongoose')
const CustomerRouter = require('./routes/routes')
const cookieSession = require('cookie-session')

app.set('trust proxy',true)
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(cookieSession({
          name:'session',
          signed: false,
          secure: false,

}))
app.use('/customer',CustomerRouter)




mongoose.connect('mongodb+srv://sayeedsafvan123:APKG4EOpV2x54PXl@crud-react.pzicfdq.mongodb.net/ms-demo-customers?retryWrites=true&w=majority&appName=crud-react')
 

const db_connect = mongoose.connection
db_connect.once('open',()=>{
          console.log('Database connected successfully!')
          app.listen(PORT,()=>{
                    console.log('Products listening to port 3003')
          })
})
