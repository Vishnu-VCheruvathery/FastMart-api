

import mongoose from "mongoose";


const userSchema = mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    role : {
        type: String,
        required: true
    },
    products: [{
        type: mongoose.Types.ObjectId,
        ref: 'Product'
    }]
})

export const userModel = mongoose.model('user', userSchema)