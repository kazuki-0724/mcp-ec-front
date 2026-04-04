import { ref } from 'vue';
import {
  addItemToCart,
  addItemToWishlist,
  applyCouponToCart,
  getAvailableCoupons,
  getCart,
  getCustomerProfile,
  getFeaturedProducts,
  getLoyaltySummary,
  getOrderDetails,
  getOrderHistory,
  getWishlist,
  removeItemFromCart,
  updateCartItemQuantity
} from '../services/commerceApi.js';

function createEmptyCommerceSections() {
  return {
    customer: false,
    orders: false,
    featured: false,
    wishlist: false
  };
}

function hasVisibleCommerceSections(sections) {
  return Object.values(sections || {}).some(Boolean);
}

export function useCommerceState() {
  const activeCustomerId = ref('C001');
  const customerProfile = ref(null);
  const loyaltySummary = ref(null);
  const featuredProducts = ref([]);
  const wishlist = ref({ items: [] });
  const cart = ref(null);
  const availableCoupons = ref([]);
  const orderHistory = ref([]);
  const orderDetails = ref(null);
  const orderLookupId = ref('O1001');
  const commerceLoading = ref(false);
  const orderLoading = ref(false);
  const pendingProductId = ref('');
  const busyCartItemId = ref('');
  const applyingCoupon = ref(false);
  const couponCode = ref('');
  const commerceStatusMessage = ref('');
  const commerceErrorMessage = ref('');

  function setCommerceStatus(message) {
    commerceStatusMessage.value = message;
    commerceErrorMessage.value = '';
  }

  function setCommerceError(message) {
    commerceStatusMessage.value = '';
    commerceErrorMessage.value = message;
  }

  function cloneCommerceSnapshot() {
    return JSON.parse(JSON.stringify({
      customerProfile: customerProfile.value,
      loyaltySummary: loyaltySummary.value,
      featuredProducts: featuredProducts.value,
      wishlist: wishlist.value,
      orderHistory: orderHistory.value,
      orderDetails: orderDetails.value,
      orderLookupId: orderLookupId.value
    }));
  }

  function buildInlineCommercePayload(messageId, sections) {
    if (!hasVisibleCommerceSections(sections) && !commerceStatusMessage.value && !commerceErrorMessage.value) {
      return null;
    }

    const snapshot = cloneCommerceSnapshot();
    return {
      messageId,
      sections,
      customerProfile: snapshot.customerProfile,
      loyaltySummary: snapshot.loyaltySummary,
      featuredProducts: snapshot.featuredProducts,
      wishlist: snapshot.wishlist,
      orderHistory: snapshot.orderHistory,
      orderDetails: snapshot.orderDetails,
      orderLookupId: snapshot.orderLookupId,
      statusMessage: commerceStatusMessage.value,
      errorMessage: commerceErrorMessage.value
    };
  }

  function replaceFeaturedProducts(products = []) {
    featuredProducts.value = Array.isArray(products) ? products : [];
  }

  function applyChatToolExecutions(toolExecutions = []) {
    let cartTouched = false;
    let wishlistTouched = false;
    let orderTouched = false;

    for (const execution of toolExecutions) {
      const result = execution?.result;
      if (!result || typeof result !== 'object') continue;

      switch (execution.name) {
        case 'get_cart':
        case 'add_item_to_cart':
        case 'update_cart_item_quantity':
        case 'remove_item_from_cart':
        case 'apply_coupon_to_cart':
          cart.value = result;
          cartTouched = true;
          break;
        case 'get_available_coupons':
          availableCoupons.value = result.coupons || [];
          break;
        case 'get_customer_profile':
          customerProfile.value = result;
          break;
        case 'get_loyalty_summary':
          loyaltySummary.value = result;
          break;
        case 'get_wishlist':
        case 'add_item_to_wishlist':
          wishlist.value = result;
          wishlistTouched = true;
          break;
        case 'get_order_history':
          orderHistory.value = result.orders || [];
          orderTouched = true;
          break;
        case 'get_order_details':
          orderDetails.value = result;
          orderLookupId.value = result.orderId || orderLookupId.value;
          orderTouched = true;
          break;
        case 'get_featured_products':
        case 'get_recommended_products':
        case 'search_products':
        case 'get_category_products':
        case 'get_brand_products':
          replaceFeaturedProducts(result.products || []);
          break;
        case 'get_product_details':
          replaceFeaturedProducts(result.itemId ? [result] : []);
          break;
        default:
          break;
      }
    }

    if (cartTouched) {
      setCommerceStatus('チャット操作の結果をカートへ反映しました。');
    } else if (wishlistTouched) {
      setCommerceStatus('チャット操作の結果をお気に入りへ反映しました。');
    } else if (orderTouched) {
      setCommerceStatus('チャット操作の結果を注文照会UIへ反映しました。');
    }
  }

  async function refreshCommerceOverview() {
    commerceLoading.value = true;
    commerceErrorMessage.value = '';

    try {
      const [profile, loyalty, featured, nextWishlist, nextCart, orders] = await Promise.all([
        getCustomerProfile(activeCustomerId.value),
        getLoyaltySummary(activeCustomerId.value),
        getFeaturedProducts(6),
        getWishlist(activeCustomerId.value),
        getCart(),
        getOrderHistory(activeCustomerId.value, 4)
      ]);
      const coupons = await getAvailableCoupons(profile?.tier || 'bronze');

      customerProfile.value = profile;
      loyaltySummary.value = loyalty;
      featuredProducts.value = featured.products || [];
      wishlist.value = nextWishlist;
      cart.value = nextCart;
      availableCoupons.value = coupons.coupons || [];
      orderHistory.value = orders.orders || [];

      if (orderHistory.value.length > 0) {
        const defaultOrderId = orderLookupId.value || orderHistory.value[0].orderId;
        orderLookupId.value = defaultOrderId;
        orderDetails.value = await getOrderDetails(defaultOrderId);
      }
    } catch (error) {
      setCommerceError(`ECデータの取得に失敗しました: ${error.message}`);
    } finally {
      commerceLoading.value = false;
    }
  }

  async function loadOrder(orderId) {
    const resolvedOrderId = String(orderId || orderLookupId.value || '').trim();
    if (!resolvedOrderId) return;

    orderLoading.value = true;

    try {
      orderDetails.value = await getOrderDetails(resolvedOrderId);
      orderLookupId.value = resolvedOrderId;
      setCommerceStatus(`注文 ${resolvedOrderId} を読み込みました。`);
    } catch (error) {
      setCommerceError(`注文照会に失敗しました: ${error.message}`);
    } finally {
      orderLoading.value = false;
    }
  }

  async function handleAddToCart(itemId, quantity = 1) {
    pendingProductId.value = itemId;

    try {
      cart.value = await addItemToCart(itemId, quantity);
      setCommerceStatus('商品をカートに追加しました。');
    } catch (error) {
      setCommerceError(`カート追加に失敗しました: ${error.message}`);
    } finally {
      pendingProductId.value = '';
    }
  }

  async function handleAddToWishlist(itemId) {
    pendingProductId.value = itemId;

    try {
      wishlist.value = await addItemToWishlist(activeCustomerId.value, itemId);
      setCommerceStatus('商品をお気に入りに追加しました。');
    } catch (error) {
      setCommerceError(`お気に入り追加に失敗しました: ${error.message}`);
    } finally {
      pendingProductId.value = '';
    }
  }

  async function handleUpdateCartQuantity({ itemId, quantity }) {
    busyCartItemId.value = itemId;

    try {
      cart.value = await updateCartItemQuantity(itemId, quantity);
      setCommerceStatus('カート数量を更新しました。');
    } catch (error) {
      setCommerceError(`カート更新に失敗しました: ${error.message}`);
    } finally {
      busyCartItemId.value = '';
    }
  }

  async function handleRemoveCartItem(itemId) {
    busyCartItemId.value = itemId;

    try {
      cart.value = await removeItemFromCart(itemId);
      setCommerceStatus('商品をカートから削除しました。');
    } catch (error) {
      setCommerceError(`カート削除に失敗しました: ${error.message}`);
    } finally {
      busyCartItemId.value = '';
    }
  }

  async function handleApplyCoupon() {
    const trimmedCoupon = couponCode.value.trim();
    if (!trimmedCoupon) return;

    applyingCoupon.value = true;

    try {
      cart.value = await applyCouponToCart(trimmedCoupon);
      setCommerceStatus(`クーポン ${trimmedCoupon} を適用しました。`);
    } catch (error) {
      setCommerceError(`クーポン適用に失敗しました: ${error.message}`);
    } finally {
      applyingCoupon.value = false;
    }
  }

  return {
    activeCustomerId,
    customerProfile,
    loyaltySummary,
    featuredProducts,
    wishlist,
    cart,
    availableCoupons,
    orderHistory,
    orderDetails,
    orderLookupId,
    commerceLoading,
    orderLoading,
    pendingProductId,
    busyCartItemId,
    applyingCoupon,
    couponCode,
    commerceStatusMessage,
    commerceErrorMessage,
    createEmptyCommerceSections,
    setCommerceStatus,
    setCommerceError,
    buildInlineCommercePayload,
    applyChatToolExecutions,
    refreshCommerceOverview,
    loadOrder,
    handleAddToCart,
    handleAddToWishlist,
    handleUpdateCartQuantity,
    handleRemoveCartItem,
    handleApplyCoupon
  };
}