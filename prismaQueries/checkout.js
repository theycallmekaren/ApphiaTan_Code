const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { getOrCreateCart } = require("./cart");

async function productDiscount(memberId, originalPrice /* ?? */) {
  let quantityTotal = 0;

  const cart = await getOrCreateCart(memberId);

  if (!cart.cartItem) {
    return 0;
  }

  cart.cartItem.forEach(function (item) {
    quantityTotal = quantityTotal + item.quantity;
  });

  const discount = await prisma.productDiscount.findFirst({
    where: {
      isAvailable: true,
      discountType: "QUANTITY",
    },
  });

  if (!discount || discount.minQuantity === null) {
    return 0;
  }

  if (quantityTotal >= discount.minQuantity) {
    const discountPercentage = Number(discount.discountPercentage);

    const discountAmount = Number(originalPrice) * (discountPercentage / 100);

    return discountAmount;
  }

  return 0;
}

async function amountDiscount(memberId) {
  let amountTotal = 0;

  const cart = await getOrCreateCart(memberId);

  if (!cart.cartItem) {
    return 0;
  }

  cart.cartItem.forEach(function (item) {
    const itemSubtotal = Number(item.price) * item.quantity;

    amountTotal = amountTotal + itemSubtotal;
  });

  const discount = await prisma.productDiscount.findFirst({
    where: {
      isAvailable: true,
      discountType: "CART_VALUE",
    },
  });

  if (!discount || discount.minCartValue === null) {
    return 0;
  }

  if (amountTotal >= Number(discount.minCartValue)) {
    const discountPercentage = Number(discount.discountPercentage);

    const discountAmount = amountTotal * (discountPercentage / 100);

    return discountAmount;
  }

  return 0;
}

async function totalDiscount(memberId) {
  let originalPrice = 0;

  const cart = await getOrCreateCart(memberId);

  if (!cart.cartItem) {
    return {
      originalPrice: 0, // where they get dis from
      quantityDiscount: 0,
      cartValueDiscount: 0,
      totalProductDiscount: 0,
      priceAfterProductDiscount: 0,
    };
  }

  cart.cartItem.forEach(function (item) {
    const itemSubtotal = Number(item.price) * item.quantity;

    originalPrice = originalPrice + itemSubtotal;
  });

  const quantityDiscount = await productDiscount(memberId, originalPrice);

  const cartValueDiscount = await amountDiscount(memberId);

  const totalProductDiscount = quantityDiscount + cartValueDiscount;

  const priceAfterProductDiscount = originalPrice - totalProductDiscount;

  return {
    originalPrice: originalPrice,
    quantityDiscount: quantityDiscount,
    cartValueDiscount: cartValueDiscount,
    totalProductDiscount: totalProductDiscount,
    priceAfterProductDiscount: priceAfterProductDiscount,
  };
}

async function deliveryFee(originalPrice) {
  if (originalPrice === 0) {
    return 0;
  }

  const deliveryRule = await prisma.deliveryDiscount.findFirst({
    where: {
      isAvailable: true,

      minCartValue: {
        lte: originalPrice, 
      },

      OR: [
        {
          maxCartValue: {    
            gte: originalPrice,
          },
        },
        {
          maxCartValue: null,
        },
      ],
    },

    orderBy: {
      minCartValue: "desc",
    },
  });

  if (!deliveryRule) {
    throw new Error("No matching delivery rule found.");
  }

  return Number(deliveryRule.deliveryFee);
}

async function calculateCheckout(memberId) {
  const discountSummary = await totalDiscount(memberId);

  const deliveryFeeAmount = await deliveryFee(
    discountSummary.originalPrice
  );

  const finalPrice =
    discountSummary.priceAfterProductDiscount +
    deliveryFeeAmount;

  return {
    originalPrice: discountSummary.originalPrice,
    quantityDiscount: discountSummary.quantityDiscount,
    cartValueDiscount: discountSummary.cartValueDiscount,
    totalProductDiscount: discountSummary.totalProductDiscount,
    priceAfterProductDiscount:
      discountSummary.priceAfterProductDiscount,
    deliveryFee: deliveryFeeAmount,
    finalPrice: finalPrice,
  };
}

module.exports = {
  calculateCheckout,
};

/*  LOGIC FLOW

    Cart items 
        ↓
    Original cart price
        ↓
    Calculate product discounts using original price
        ↓
    Discounted cart price
        ↓
    Determine delivery fee using original price
        ↓
    Final price = discounted cart price + delivery fee 
*/
