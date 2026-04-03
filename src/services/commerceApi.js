async function callTool(name, args = {}) {
  const res = await fetch('/api/mcp/tool', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      arguments: args
    })
  });

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await res.json() : { error: await res.text() };

  if (!res.ok) {
    throw new Error(payload?.error || `APIエラーが発生しました。status=${res.status}`);
  }

  if (payload?.data?.error) {
    throw new Error(payload.data.error);
  }

  return payload.data;
}

export function getCart() {
  return callTool('get_cart');
}

export function addItemToCart(itemId, quantity = 1) {
  return callTool('add_item_to_cart', { itemId, quantity });
}

export function updateCartItemQuantity(itemId, quantity) {
  return callTool('update_cart_item_quantity', { itemId, quantity });
}

export function removeItemFromCart(itemId) {
  return callTool('remove_item_from_cart', { itemId });
}

export function applyCouponToCart(couponCode) {
  return callTool('apply_coupon_to_cart', { couponCode });
}

export function getAvailableCoupons(customerTier) {
  return callTool('get_available_coupons', { customerTier });
}

export function getCustomerProfile(customerId) {
  return callTool('get_customer_profile', { customerId });
}

export function getLoyaltySummary(customerId) {
  return callTool('get_loyalty_summary', { customerId });
}

export function getWishlist(customerId) {
  return callTool('get_wishlist', { customerId });
}

export function addItemToWishlist(customerId, itemId) {
  return callTool('add_item_to_wishlist', { customerId, itemId });
}

export function getFeaturedProducts(limit = 6) {
  return callTool('get_featured_products', { limit });
}

export function getOrderHistory(customerId, limit = 5) {
  return callTool('get_order_history', { customerId, limit });
}

export function getOrderDetails(orderId) {
  return callTool('get_order_details', { orderId });
}