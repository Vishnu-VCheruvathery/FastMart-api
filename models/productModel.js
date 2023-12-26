import mongoose from 'mongoose';



const productSchema = new mongoose.Schema({
    type: {
      type: String, // Store the type of product (e.g., 'phone', 'computer', etc.)
      required: true,
    },
    name: String,
    price: Number,
    imageUrl: String,
    image: String,
    info: String,
  });
  
  // Create the Product model
 export const Product = mongoose.model('Product', productSchema);

 // Create discriminators for each product type
const Phone = Product.discriminator('phone', new mongoose.Schema({}));
const Computer = Product.discriminator('computer', new mongoose.Schema({}));
const Fashion = Product.discriminator('fashion', new mongoose.Schema({}));
const Kitchen = Product.discriminator('kitchen', new mongoose.Schema({}));
const HomeDecor = Product.discriminator('homeDecor', new mongoose.Schema({}));
const Toys = Product.discriminator('toys', new mongoose.Schema({}));