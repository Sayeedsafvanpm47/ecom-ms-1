const Router = require('express').Router
const router = new Router()
const User = require('../models/user')
const jwt = require('jsonwebtoken')








router.post('/signout',async(req,res)=>{
          req.session = null 
          return res.status(200).send({"message":"user signed out successfully!"})
})


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