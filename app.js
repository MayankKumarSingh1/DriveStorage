const express = require('express')
const app = express()
const userRouter = require('./routes/user.routes')
const dotenv= require('dotenv')
dotenv.config();
const connectToDB = require('./config/db')
connectToDB();

const indexRouter = require('./routes/index.routes')
const cookieParser = require('cookie-parser')

app.set("view engine","ejs")
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use('/user',userRouter)

app.use('/', indexRouter)
const PORT = process.env.PORT || 8080;

app.listen(PORT,()=>{
    console.log(`Server is running on ${PORT}`)
}) 