import dotenv from 'dotenv';
dotenv.config();

import express from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { userModel } from '../models/users.js'
const router = express.Router()

const {SECRET_KEY} = process.env


router.get("/", async(req,res) => {
  try {
     const response = await userModel.find({})
     res.json(response)
  } catch (error) {
    console.log(error)
    res.json(error)
  }
})

router.post("/register", async(req,res) => {

    const {username, password, role} = req.body
    const user = await userModel.findOne({username})
    if(user){
      return res.json({message: "user already exists!"})
    }
    const hashedPassword = await bcrypt.hash(password, 10)
    try{
      const newUser = new userModel({username, password:hashedPassword, role})
      const response = newUser.save()
      res.json(response)
  } catch (error) {
    console.log(error)
  }
})

router.post('/login',async(req,res) => {
  try {
    const {username, password} = req.body
    const user = await userModel.findOne({username})

    if(!user){
      return res.json({
        error: 'No User Found'
      });
    }

    const match = await bcrypt.compare(password, user.password)

    if(match){
      const token = jwt.sign({id: user._id, username: username, role:user.role},
         SECRET_KEY
        )
      res.json({token})
    } else {
      res.json({
        error: "Passwords don't match, Try again"
      })
    }
  } catch (error) {
    console.log(error)
  }
})

  export {router as UserRouter}

  export const verifyToken = (req, res, next) => {
    const token = req.headers.authorization;
    if (token) {
      const tokenParts = token.split(' ');
      if (tokenParts.length === 2 && tokenParts[0] === 'Bearer') {
        const tokenString = tokenParts[1];
        // Verify the token here
        jwt.verify(tokenString, SECRET_KEY, (err, decoded) => {
          if (err) {
            return res.sendStatus(403);
          } else {
            // Attach the decoded payload to the request object
            req.decoded = decoded;
            next();
          }
        });
      } else {
        res.sendStatus(401);
      }
    } else {
      res.sendStatus(401);
    }
  };