const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { getCartByMember } = require("./cart");

function roundMoney(value) {
  return Number(Number(value).toFixed(2));
}

async function productDiscount(cartItems) {
  let total = 0;
  const appliedDiscounts = [];

  if (cartItems.length === 0) {
    return {
      total: 0,
      appliedDiscounts: [],
    };
  }

  const productIds = cartItems.map(function (item) {
    return item.productId;
  });

  const discountRules = await prisma.productDiscount.findMany({
    where: {
      isAvailable: true,
      discountType: "QUANTITY",
      productId: {
        in: productIds,
      },
    },
    orderBy: [
      {
        minQuantity: "desc",
      },
      {
        discountPercentage: "desc",
      },
    ],
  });

  cartItems.forEach(function (item) {
    const discount = discountRules.find(function (rule) {
      return (
        rule.productId === item.productId && item.quantity >= rule.minQuantity
      );
    });

    if (!discount) {
      return;
    }

    const productSubtotal = Number(item.price) * item.quantity;
    const discountAmount = roundMoney(
      productSubtotal * (Number(discount.discountPercentage) / 100),
    );

    total = total + discountAmount;
    appliedDiscounts.push({
      productId: item.productId,
      productName: item.productName,
      discountName: discount.name,
      quantity: item.quantity,
      discountPercentage: Number(discount.discountPercentage),
      discountAmount: discountAmount,
    });
  });

  return {
    total: roundMoney(total),
    appliedDiscounts: appliedDiscounts,
  };
}

async function amountDiscount(originalPrice) {
  const discount = await prisma.productDiscount.findFirst({
    where: {
      isAvailable: true,
      discountType: "CART_VALUE",
      minCartValue: {
        lte: originalPrice,
      },
    },
    orderBy: [
      {
        minCartValue: "desc",
      },
      {
        discountPercentage: "desc",
      },
    ],
  });

  if (!discount) {
    return 0;
  }

  return roundMoney(
    originalPrice * (Number(discount.discountPercentage) / 100),
  );
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
    const error = new Error("No matching delivery rule found.");
    error.statusCode = 422;
    throw error;
  }

  return roundMoney(deliveryRule.deliveryFee);
}

async function calculateCheckout(memberId) {
  const cart = await getCartByMember(memberId);
  let cartItems;

  if (cart && cart.cartItem) {
    cartItems = cart.cartItem;
  } else {
    cartItems = [];
  }
  cartItems = cartItems.filter(function (item) {
    return item.product && item.product.isAvailable === true;
  });

  let originalPrice = 0;

  cartItems.forEach(function (item) {
    originalPrice = originalPrice + Number(item.price) * item.quantity;
  });

  originalPrice = roundMoney(originalPrice);

  const quantityDiscount = await productDiscount(cartItems);
  const cartValueDiscount = await amountDiscount(originalPrice);
  const totalProductDiscount = roundMoney(
    quantityDiscount.total + cartValueDiscount,
  );
  const priceAfterProductDiscount = roundMoney(
    Math.max(originalPrice - totalProductDiscount, 0),
  );
  const deliveryFeeAmount = await deliveryFee(originalPrice);
  const finalPrice = roundMoney(priceAfterProductDiscount + deliveryFeeAmount);

  return {
    originalPrice: originalPrice,
    quantityDiscount: quantityDiscount.total,
    quantityDiscounts: quantityDiscount.appliedDiscounts,
    cartValueDiscount: cartValueDiscount,
    totalProductDiscount: totalProductDiscount,
    priceAfterProductDiscount: priceAfterProductDiscount,
    deliveryFee: deliveryFeeAmount,
    finalPrice: finalPrice,
  };
}

module.exports = {
  calculateCheckout,
};
