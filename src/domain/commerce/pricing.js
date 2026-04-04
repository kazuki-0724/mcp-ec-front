function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

export function normalizeCustomerTier(customerTier) {
  const normalized = normalizeText(customerTier);
  if (['gold', 'silver', 'bronze'].includes(normalized)) return normalized;
  return 'bronze';
}

export function buildPriceLine({ product, quantity, customerTier }) {
  const tier = normalizeCustomerTier(customerTier);
  const tierDiscountRate = tier === 'gold' ? 0.1 : tier === 'silver' ? 0.05 : 0;
  const bulkDiscountRate = quantity >= 10 ? 0.08 : quantity >= 5 ? 0.05 : 0;
  const appliedDiscountRate = Math.min(0.25, tierDiscountRate + bulkDiscountRate);
  const unitPrice = product.unitPrice;
  const originalSubtotal = unitPrice * quantity;
  const discountAmount = Math.round(originalSubtotal * appliedDiscountRate);
  const subtotal = originalSubtotal - discountAmount;

  return {
    itemId: product.itemId,
    itemName: product.itemName,
    quantity,
    unitPrice,
    originalSubtotal,
    discountAmount,
    subtotal,
    appliedDiscountRate,
    unit: product.unit
  };
}

export function calculateCouponDiscount({ coupon, subtotal }) {
  if (!coupon || subtotal < coupon.minTotal) return 0;

  return coupon.discountType === 'fixed'
    ? coupon.discountValue
    : Math.round(subtotal * (coupon.discountValue / 100));
}

export function buildBulkPriceQuote({ items, customerTier, couponCode, coupon }) {
  const subtotal = items.reduce((sum, line) => sum + line.subtotal, 0);
  const couponDiscount = calculateCouponDiscount({ coupon, subtotal });

  return {
    customerTier: normalizeCustomerTier(customerTier),
    couponCode: couponCode || null,
    items,
    summary: {
      subtotal,
      couponDiscount,
      grandTotal: Math.max(0, subtotal - couponDiscount)
    }
  };
}

export function buildCartSummary({ cart, items, coupon }) {
  const subtotal = items.reduce((sum, line) => sum + line.subtotal, 0);
  const originalSubtotal = items.reduce((sum, line) => sum + line.originalSubtotal, 0);
  const lineDiscountTotal = items.reduce((sum, line) => sum + line.discountAmount, 0);
  const couponDiscount = calculateCouponDiscount({ coupon, subtotal });
  const shippingFee = subtotal >= 3500 ? 0 : 550;

  return {
    cartId: cart.cartId,
    customerId: cart.customerId,
    couponCode: cart.couponCode,
    items,
    summary: {
      originalSubtotal,
      lineDiscountTotal,
      couponDiscount,
      subtotal,
      shippingFee,
      grandTotal: Math.max(0, subtotal - couponDiscount) + shippingFee
    }
  };
}

export function buildInventoryStatus(product) {
  return {
    itemId: product.itemId,
    stock: product.stock,
    availability: product.stock > 50 ? 'in_stock' : product.stock > 10 ? 'limited' : 'low_stock',
    estimatedRestockDays: product.stock > 10 ? 0 : 5
  };
}

export function estimateShippingFeeQuote({ postalCode, prefecture, shippingMethod, cartTotal }) {
  const normalizedMethod = normalizeText(shippingMethod) || 'standard';
  const isRemote = ['北海道', '沖縄県'].includes(prefecture);
  const baseFee = normalizedMethod === 'express' ? 880 : 550;
  const remoteSurcharge = isRemote ? 420 : 0;
  const freeShippingThreshold = normalizedMethod === 'express' ? 6000 : 3500;
  const shippingFee = cartTotal >= freeShippingThreshold ? 0 : baseFee + remoteSurcharge;

  return {
    postalCode,
    prefecture,
    shippingMethod: normalizedMethod,
    shippingFee,
    freeShippingThreshold,
    remoteSurcharge
  };
}