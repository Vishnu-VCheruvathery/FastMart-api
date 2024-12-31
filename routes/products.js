import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { Product } from '../models/productModel.js';
const router = express.Router()
import multer from 'multer';
import path from 'path'
import { fileURLToPath } from 'url';
import stripe from 'stripe';
import { verifyToken } from './users.js';
import { userModel } from '../models/users.js';
const { STRIPE_PRIVATE_KEY, CLIENT_URL } = process.env;
const stripeInstance = stripe(STRIPE_PRIVATE_KEY);

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
      const destinationPath = path.join(__dirname, '../../client/src/images');
      cb(null, destinationPath)
  },
  filename: (req, file, cb) => {
      cb(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname))
  }
})

const upload = multer({
  storage: storage
})
router.get('/find', async (req, res) => {
  try {
    const searchTerm = req.query.name; 

    if (!searchTerm) {
      return res.status(400).json({ error: 'Search term is required' });
    }


    // Use a regular expression to perform a case-insensitive partial match
    const regex = new RegExp(searchTerm, 'i');
    const response = await Product.find({ name: { $regex: regex } });

    res.json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred' });
  }
});


router.get('/stock', async(req,res) => {
  try {
     const category = req.query.category
     let response 
     switch(category){
      case "Phones":
         response = await Product.find({type: 'phone'})
         break;
      case "Kitchen":
          response = await Product.find({type: 'kitchen'})
          break;
      case "Computers":
          response = await Product.find({type: 'computer'})
          break;
      case "Home Decor":
           response = await Product.find({type: 'homeDecor'})
           break;
      case "Fashion":
           response = await Product.find({type: 'fashion'})
           break;
      case "Toys":
            response = await Product.find({type: 'toys'})
            break;
            default:
              return res.status(400).json({ message: 'Invalid productType' });
     }
     
     
     res.json(response)
  } catch (error) {
    console.error(error)
  }
})

router.get('/', async(req,res) => {
  try {
    const response = await Product.find({})
    res.json(response)
  } catch (error) {
    res.json(error)
    console.log(error)
  }
})


router.post("/add", verifyToken, upload.single('image'), async(req,res) => {
     try {
      const {name, price, productType, info} = req.body
      const imageFilename = req.file ? req.file.filename : null
      let newProduct
      switch(productType){
        case 'Phones':
           newProduct = new Product({type : 'phone', name, price, info, image: imageFilename})
           break;
        case 'Computers':
           newProduct = new Product({type: 'computer', name, price, info, image: imageFilename})
           break;
        case 'Kitchen':
            newProduct = new Product({type: 'kitchen', name, price, info, image: imageFilename})
            break;
        case 'homeDecor':
              newProduct = new Product({type: 'homeDecor', name, price, info, image: imageFilename})
              break;
        case 'Clothes':
              newProduct = new Product({type: 'fashion', name, price, info, image: imageFilename})
                break;
        case 'Toys':
          newProduct = new Product({type: 'toys', name, price, info, image: imageFilename})
          break;
      }

      await newProduct.save()
      res.status(201).json({ message: 'Added Product Successfully' });
     } catch (error) {
      console.error(error)
     }
})

router.get('/cart/:id', async(req,res) => {
  let {id} = req.params 
  try {
    const response = await userModel.findById(id)
    .populate({
      path: 'products',
      select: 'name price imageUrl'
    })

    res.json(response)
  } catch (error) {
    console.log(error)
  }
})

router.post('/cart/:userID/:id',  async(req,res) => {
   const {userID, id} = req.params
   console.log(userID, id)
   try {
       await userModel.findByIdAndUpdate(userID, {$push: {products: id} }) 
       res.status(201).json({ message: 'Product added successfully' });
   } catch (error) {
      console.log(error)
   }
  
})

router.delete('/cart/:userID', async (req, res) => {
  const { userID } = req.params;

  try {
    const result = await userModel.findByIdAndUpdate(userID, {
      $set: { products: [] }
    });

    if (!result) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'All products removed from the cart' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

router.post('/checkout', async (req, res) => {
  try {
    const lineItems = [];

    for (const item of req.body.items) {
      const storeItem = await Product.findById(item._id);

      if (storeItem) {
        const unitAmountInPaise = storeItem.price * 100;
        lineItems.push({
          price_data: {
            currency: 'inr',
            product_data: {
              name: storeItem.name,
            },
            unit_amount: unitAmountInPaise,
          },
          quantity: 1,
        }); 
      } else {
      
        console.error(`Product not found for item ID: ${item._id}`);
      }
    } 

    if (lineItems.length === 0) {
      return res.status(400).json({ error: 'No valid items in the cart' });
    }

    const session = await stripeInstance.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: lineItems,
      success_url: `${CLIENT_URL}?payment=success`,
      cancel_url: `${CLIENT_URL}/cancel`,
    });

    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export {router as productRouter}