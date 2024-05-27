const httpStatus = require("http-status");
const { Cart, Product } = require("../models");
const ApiError = require("../utils/ApiError");
const config = require("../config/config");
const { contentSecurityPolicy } = require("helmet");

// TODO: CRIO_TASK_MODULE_CART - Implement the Cart service methods

/**
 * Fetches cart for a user
 * - Fetch user's cart from Mongo
 * - If cart doesn't exist, throw ApiError
 * --- status code  - 404 NOT FOUND
 * --- message - "User does not have a cart"
 *
 * @param {User} user
 * @returns {Promise<Cart>}
 * @throws {ApiError}
 */
const getCartByUser = async (user) => {
  const cart = await Cart.findOne({ email: user.email });
  if (!cart) {
    throw new ApiError(httpStatus.NOT_FOUND, "User does not have a cart");
  }
  
  return cart;
};

/**
 * Adds a new product to cart
 * - Get user's cart object using "Cart" model's findOne() method
 * --- If it doesn't exist, create one
 * --- If cart creation fails, throw ApiError with "500 Internal Server Error" status code
 *
 * - If product to add already in user's cart, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product already in cart. Use the cart sidebar to update or remove product from cart"
 *
 * - If product to add not in "products" collection in MongoDB, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product doesn't exist in database"
 *
 * - Otherwise, add product to user's cart
 *
 *
 *
 * @param {User} user
 * @param {string} productId
 * @param {number} quantity
 * @returns {Promise<Cart>}
 * @throws {ApiError}
 */
// const addProductToCart = async (user, productId, quantity) => {

//     let cart = await Cart.findOne({ email: user.email });
//     console.log("the cart ----->",cart);

//     // If cart doesn't exist, create one
//     if (!cart) {
//       try{
//         cart = await Cart.create({
//           email: user.email,
//           cartItems: [],
//           paymentOption: config.default_payment_option,
//         });
//       }catch(err){
//         throw new ApiError(
//           httpStatus.INTERNAL_SERVER_ERROR,
//           "Failed to create cart"
//         );
//       }
//     }


//     if(cart == null){
//       throw new ApiError(
//         httpStatus.INTERNAL_SERVER_ERROR,
//         "User does not have a cart"
//       );
//     }


//     let productIndex = -1;
//     for(let i=0;i<cart.cartItems.length;i++){
//       if(productId === cart.cartItems[i].product._id){
//         productIndex = i;
//         break;
//       }
//     }

//     if(productIndex == -1){
//       let product = await Product.findOne({ _id: productId});

//       if(product == null){
//         throw new ApiError(
//           httpStatus.BAD_REQUEST,
//           "Product doesn't exist in db."
//         );
//       }

//       cart.cartItems.push({ product,quantity});
//     }else {
//       throw new ApiError(
//         httpStatus.BAD_REQUEST,
//         "Product already in cart. Use the cart sidebar to update or remove product from cart"
//       );
//     }

//     await cart.save();
//     return cart;
  
// };

const addProductToCart = async (user, productId, quantity) => {
  try {
    let cart = await Cart.findOne({ email: user.email });

    if (!cart) {
      cart = await Cart.create({
        email: user.email,
        cartItems: [],
        paymentOption: config.default_payment_option,
      });
    }

    const productIndex = cart.cartItems.findIndex(
      (item) => item.product._id.toString() === productId.toString()
    );

    if (productIndex !== -1) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Product already in cart. Use the cart sidebar to update or remove product from cart"
      );
    }

    const product = await Product.findById(productId);
    if (!product) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Product doesn't exist in db.");
    }

    cart.cartItems.push({ product, quantity });
    await cart.save();
    return cart;
  } catch (err) {
    if (err.statusCode === httpStatus.BAD_REQUEST) {
      throw err;
    }
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to add product to cart");
  }
};
/**
 * Updates the quantity of an already existing product in cart
 * - Get user's cart object using "Cart" model's findOne() method
 * - If cart doesn't exist, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "User does not have a cart. Use POST to create cart and add a product"
 *
 * - If product to add not in "products" collection in MongoDB, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product doesn't exist in database"
 *
 * - If product to update not in user's cart, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product not in cart"
 *
 * - Otherwise, update the product's quantity in user's cart to the new quantity provided and return the cart object
 *
 *
 * @param {User} user
 * @param {string} productId
 * @param {number} quantity
 * @returns {Promise<Cart>}
 * @throws {ApiError}
 */
const updateProductInCart = async (user, productId, quantity) => {
  const cart = await Cart.findOne({ email: user.email });

  if (!cart) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "User does not have a cart. Use POST to create cart and add a product"
    );
  }

  const product = await Product.findOne({ _id: productId});

  if (!product) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Product doesn't exist in database");
  }

  let productIndex = -1;
  for(let i=0;i < cart.cartItems.length;i++){
    if(productId == cart.cartItems[i].product._id){
      productIndex = i;
    }
  }

  if(productIndex == -1){
    throw new ApiError(httpStatus.BAD_REQUEST, "Product not in cart");
  }else {
    cart.cartItems[productIndex].quantity = quantity;
  }

  await cart.save();

  return cart;
};

/**
 * Deletes an already existing product in cart
 * - If cart doesn't exist for user, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "User does not have a cart"
 *
 * - If product to update not in user's cart, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product not in cart"
 *
 * Otherwise, remove the product from user's cart
 *
 *
 * @param {User} user
 * @param {string} productId
 * @throws {ApiError}
 */
const deleteProductFromCart = async (user, productId) => {
  const cart = await Cart.findOne({ email: user.email });

  if (!cart) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User does not have a cart");
  }

  const productExists = cart.cartItems.some(
    (item) => item.product._id.toString() === productId
  );

  if (!productExists) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Product not in cart");
  }

  const updatedCart = cart.cartItems.filter(
    (item) => item.product._id.toString() !== productId
  );

  cart.cartItems = updatedCart;
  await cart.save();
};

// TODO: CRIO_TASK_MODULE_TEST - Implement checkout function
/**
 * Checkout a users cart.
 * On success, users cart must have no products.
 *
 * @param {User} user
 * @returns {Promise}
 * @throws {ApiError} when cart is invalid
 */
const checkout = async (user) => {
  
  try {
    const cart = await Cart.findOne({ email: user.email });

    if (!cart) {
      throw new ApiError(httpStatus.NOT_FOUND, "User does not have a cart");
    }

    if (cart.cartItems.length === 0) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Cart does not have any products"
      );
    }

    if (!(await user.hasSetNonDefaultAddress())) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "User must set a non-default address to checkout"
      );
    }

    const total = cart.cartItems.reduce(
      (acc, item) => acc + item.product.cost * item.quantity,
      0
    );

    if (user.walletMoney < total) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "User does not have enough balance to checkout"
      );
    }

    // Deduct total cost from user's wallet balance
    user.walletMoney -= total;

    // Empty the cart
    cart.cartItems = [];

    // Save the updated user and cart objects
    await user.save();
    await cart.save();

    // Return success
    return { success: true };
  } catch (error) {
    // Handle error
    throw error;
  }
};

module.exports = {
  getCartByUser,
  addProductToCart,
  updateProductInCart,
  deleteProductFromCart,
  checkout,
};
