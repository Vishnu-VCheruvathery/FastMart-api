import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import { productRouter } from './routes/products.js'
import { UserRouter } from './routes/users.js'
const {MONGO_URL} = process.env

const app = express()

app.use(cors())
app.use(express.json())
app.use('/products', productRouter)
app.use('/users', UserRouter)



mongoose.connect(MONGO_URL)

app.listen(3000, () => {
    console.log("Server is running on port 3000")
})