const exp=require('express')
const adminApp=exp.Router()

adminApp.get('/test-author',(req,res)=>{
    res.send({message:"This is admin api"})
})



module.exports=adminApp