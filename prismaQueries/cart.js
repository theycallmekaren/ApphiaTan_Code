const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function getCartByMember(memberId) {
  return prisma.cart.findUnique({
    where: {
      memberId: memberId,
    },
    include: {
      cartItem: {
        orderBy: {
          cartItemId: "asc",
        },
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
      memberId: memberId
    },
  });
}

async function getOrCreateCart(memberId) {
  return prisma.cart.upsert({
    where: {
      memberId: memberId,
    },
    update: {},
    create: {
      memberId: memberId,
    },
  });
}

async function createCartItem(memberId, productId, quantity) {
  const product = await prisma.product.findFirst({
    where: {
      productId: productId,
      isAvailable: true,
    },
  });

  if (!product) {
    const error = new Error("Product is not available or does not exist.");
    error.statusCode = 404;
    throw error;
  }

  const cart = await getOrCreateCart(memberId);

  return prisma.cartItem.upsert({
    where: {
      cartId_productId: {
        cartId: cart.cartId,
        productId: product.productId,
      },
    },
    update: {
      quantity: {
        increment: quantity,
      },
    },
    create: {
      cartId: cart.cartId,
      productId: product.productId,
      productName: product.name,
      quantity: quantity,
      price: product.price,
    },
  });
}

async function updateCartItem(memberId, cartItemId, newQuantity) {
  const cartItem = await prisma.cartItem.findFirst({
    where: {
      cartItemId: cartItemId,
      cart: {
        memberId: memberId,
      },
    },
  });

  if (!cartItem) {
    const error = new Error("Cart item not found.");
    error.statusCode = 404;
    throw error;
  }

  return prisma.cartItem.update({
    where: {
      cartItemId: cartItem.cartItemId,
    },
    data: {
      quantity: newQuantity,
    },
  });
}

async function deleteCartItem(memberId, cartItemId) {
  const cartItem = await prisma.cartItem.findFirst({
    where: {
      cartItemId: cartItemId,
      cart: {
        memberId: memberId,
      },
    },
  });

  if (!cartItem) {
    const error = new Error("Cart item not found.");
    error.statusCode = 404;
    throw error;
  }

  return prisma.cartItem.delete({
    where: {
      cartItemId: cartItem.cartItemId,
    },
  });
}

function getCartItem(memberId) {
  return getCartByMember(memberId);
}

async function getCartSummary(memberId) {
  const cartItem = await prisma.cartItem.findMany({
    where: {
      cart: {
        memberId: memberId,
      },
    },
    select: {
      cartItemId: true,
      productName: true,
      price: true,
      quantity: true,
    },
    orderBy: {
      cartItemId: "asc",
    },
  });

  let totalQuantity = 0;
  let totalCheckoutPrice = 0;

  const items = cartItem.map(function (item) {
    const subtotal = Number(item.price) * item.quantity;

    totalQuantity = totalQuantity + item.quantity;
    totalCheckoutPrice = totalCheckoutPrice + subtotal;

    return {
      cartItemId: item.cartItemId,
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
