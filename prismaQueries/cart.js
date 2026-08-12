const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function getCartByMember(memberId) {
  return prisma.cart.findFirst({
    where: {
      memberId: memberId,
    },
    include: {
      cartItem: {
        include: {
          product: true,
        },
      },
    },
  });
}

function createCart(memberId) {
  return prisma.cart.create({
    data: {
      memberId: memberId,
    },
  });
}

async function getOrCreateCart(memberId) {
  const existingCart = await getCartByMember(memberId);

  if (existingCart) {
    return existingCart;
  }

  return createCart(memberId);
}

async function createCartItem(memberId, productId, quantity) {
  const cart = await getOrCreateCart(memberId);
  const product = await prisma.product.findFirst({
    where: {
      productId: productId,
      isAvailable: true,
    },
  });
  if (!product) {
    throw new Error("Product is not available or does not exist.");
  }

  return prisma.cartItem.create({
    data: {
      cartId: cart.cartId,
      productId: product.productId,
      productName: product.name,
      quantity: quantity,
      price: product.price,
    },
  });
}

function updateCartItem(cartItemId, newQuantity) {
  return prisma.cartItem.update({
    where: {
      cartItemId: cartItemId,
    },
    data: {
      quantity: newQuantity,
    },
  });
}

function deleteCartItem(cartItemId) {
  return prisma.cartItem.delete({
    where: {
      cartItemId: cartItemId,
    },
  });
}

function getCartItem(memberId) {
  return getCartByMember(memberId);
}

async function getCartSummary(memberId) {
  const cartItems = await prisma.cartItem.findMany({
    where: {
      cart: {
        memberId: memberId,
      },
    },
    select: {
      productName: true,
      price: true,
      quantity: true,
    },
  });

  let totalQuantity = 0;
  let totalCheckoutPrice = 0;

  const items = cartItems.map(function (item) {
    const subtotal = Number(item.price) * item.quantity;

    totalQuantity = totalQuantity + item.quantity;
    totalCheckoutPrice = totalCheckoutPrice + subtotal;

    return {
      productName: item.productName,
      price: item.price.toString(),
      quantity: item.quantity,
      subtotal: subtotal.toFixed(2),
    };
  });

  return {
    items: items,
    totalQuantity: totalQuantity,
    totalCheckoutPrice: totalCheckoutPrice.toFixed(2),
  };
}

module.exports = {
  getCartByMember,
  createCart,
  getOrCreateCart,
  createCartItem,
  updateCartItem,
  deleteCartItem,
  getCartItem,
  getCartSummary,
};
