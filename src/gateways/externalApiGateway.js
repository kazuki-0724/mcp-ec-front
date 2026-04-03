const mockDatabase = {
    employees: {
        E001: { employeeId: "E001", name: "山田太郎", department: "システム開発部", role: "ストア運営責任者", email: "taro.yamada@example.com" },
        E002: { employeeId: "E002", name: "佐藤花子", department: "インフラ推進部", role: "SRE", email: "hanako.sato@example.com" },
        E003: { employeeId: "E003", name: "鈴木一郎", department: "EC商品企画部", role: "MD", email: "ichiro.suzuki@example.com" }
    },
    categories: [
        { categoryId: "CAT-FRESH", categoryName: "生鮮食品", description: "野菜・肉・乳製品" },
        { categoryId: "CAT-PANTRY", categoryName: "加工食品", description: "レトルト・調味料・乾物" },
        { categoryId: "CAT-DAILY", categoryName: "日用品", description: "洗剤・キッチン用品" },
        { categoryId: "CAT-BEAUTY", categoryName: "ビューティー", description: "スキンケア・ヘアケア" },
        { categoryId: "CAT-BEVERAGE", categoryName: "飲料", description: "水・お茶・コーヒー" }
    ],
    brands: [
        { brandId: "BR-LOCAL", brandName: "Local Farm", country: "日本" },
        { brandId: "BR-AURA", brandName: "Aura Select", country: "日本" },
        { brandId: "BR-CLEAN", brandName: "Clean Home", country: "日本" },
        { brandId: "BR-GLOW", brandName: "Glow Lab", country: "日本" },
        { brandId: "BR-BREW", brandName: "Morning Brew", country: "日本" }
    ],
    products: [
        { itemId: "G001", itemName: "国産 玉ねぎ", categoryId: "CAT-FRESH", brandId: "BR-LOCAL", unitPrice: 120, unit: "個", stock: 82, tags: ["野菜", "カレー", "定番"], description: "甘みの強い国産玉ねぎ。", featured: true },
        { itemId: "G002", itemName: "北海道 じゃがいも", categoryId: "CAT-FRESH", brandId: "BR-LOCAL", unitPrice: 80, unit: "個", stock: 105, tags: ["野菜", "カレー", "煮込み"], description: "煮崩れしにくい男爵系。", featured: true },
        { itemId: "G003", itemName: "にんじん", categoryId: "CAT-FRESH", brandId: "BR-LOCAL", unitPrice: 90, unit: "本", stock: 66, tags: ["野菜", "カレー", "サラダ"], description: "みずみずしい国産にんじん。", featured: false },
        { itemId: "G004", itemName: "牛こま切れ肉", categoryId: "CAT-FRESH", brandId: "BR-LOCAL", unitPrice: 450, unit: "100g", stock: 40, tags: ["肉", "カレー", "炒め物"], description: "旨みのある国産牛こま。", featured: true },
        { itemId: "G005", itemName: "カレールー 中辛", categoryId: "CAT-PANTRY", brandId: "BR-AURA", unitPrice: 260, unit: "箱", stock: 120, tags: ["カレー", "ルー", "定番"], description: "コクと香りのバランスが良い中辛。", featured: true },
        { itemId: "G006", itemName: "国産 福神漬け", categoryId: "CAT-PANTRY", brandId: "BR-AURA", unitPrice: 150, unit: "袋", stock: 90, tags: ["カレー", "付け合わせ"], description: "甘さ控えめの福神漬け。", featured: false },
        { itemId: "G007", itemName: "濃縮だしつゆ", categoryId: "CAT-PANTRY", brandId: "BR-AURA", unitPrice: 380, unit: "本", stock: 54, tags: ["調味料", "和食"], description: "煮物や麺つゆに使える濃縮タイプ。", featured: false },
        { itemId: "G008", itemName: "台所用洗剤 シトラス", categoryId: "CAT-DAILY", brandId: "BR-CLEAN", unitPrice: 298, unit: "本", stock: 73, tags: ["洗剤", "キッチン"], description: "油汚れに強い台所用洗剤。", featured: true },
        { itemId: "G009", itemName: "高保湿フェイスマスク 7枚入", categoryId: "CAT-BEAUTY", brandId: "BR-GLOW", unitPrice: 680, unit: "袋", stock: 31, tags: ["美容", "保湿", "スキンケア"], description: "夜の集中ケア向けフェイスマスク。", featured: false },
        { itemId: "G010", itemName: "ドリップコーヒー 10袋", categoryId: "CAT-BEVERAGE", brandId: "BR-BREW", unitPrice: 540, unit: "箱", stock: 88, tags: ["コーヒー", "朝食"], description: "すっきりした後味のブレンド。", featured: true }
    ],
    recipes: [
        {
            id: "RECIPE001",
            name: "カレー",
            keywords: ["カレー", "カレーライス", "カレーの材料"],
            servings: 4,
            ingredients: [
                { ingredientName: "玉ねぎ", requiredQty: "2個", itemId: "G001" },
                { ingredientName: "じゃがいも", requiredQty: "3個", itemId: "G002" },
                { ingredientName: "にんじん", requiredQty: "1本", itemId: "G003" },
                { ingredientName: "牛こま切れ肉", requiredQty: "300g", itemId: "G004" },
                { ingredientName: "カレールー", requiredQty: "1箱", itemId: "G005" },
                { ingredientName: "福神漬け", requiredQty: "1袋", itemId: "G006" }
            ]
        },
        {
            id: "RECIPE002",
            name: "肉じゃが",
            keywords: ["肉じゃが", "煮物"],
            servings: 3,
            ingredients: [
                { ingredientName: "玉ねぎ", requiredQty: "1個", itemId: "G001" },
                { ingredientName: "じゃがいも", requiredQty: "4個", itemId: "G002" },
                { ingredientName: "牛こま切れ肉", requiredQty: "250g", itemId: "G004" },
                { ingredientName: "濃縮だしつゆ", requiredQty: "50ml", itemId: "G007" }
            ]
        }
    ],
    featuredProductIds: ["G001", "G002", "G004", "G005", "G008", "G010"],
    recommendationMap: {
        G005: ["G001", "G002", "G003", "G004", "G006"],
        G010: ["G009", "G008"],
        default: ["G005", "G010", "G008", "G001"]
    },
    coupons: [
        { couponCode: "WELCOME10", description: "初回購入10%オフ", discountType: "percentage", discountValue: 10, minTotal: 1500, eligibleTiers: ["bronze", "silver", "gold"] },
        { couponCode: "PANTRY200", description: "加工食品カテゴリ200円オフ", discountType: "fixed", discountValue: 200, minTotal: 1200, eligibleTiers: ["silver", "gold"] },
        { couponCode: "GOLD15", description: "ゴールド会員15%オフ", discountType: "percentage", discountValue: 15, minTotal: 3000, eligibleTiers: ["gold"] }
    ],
    customerProfiles: {
        C001: {
            customerId: "C001",
            fullName: "橋本和樹",
            email: "kazuki.hashimoto@example.com",
            tier: "gold",
            defaultAddress: {
                postalCode: "1500001",
                prefecture: "東京都",
                city: "渋谷区",
                line1: "神宮前1-2-3",
                line2: "Apt 502"
            },
            favoriteCategoryIds: ["CAT-FRESH", "CAT-BEVERAGE"]
        },
        C002: {
            customerId: "C002",
            fullName: "中村悠",
            email: "yu.nakamura@example.com",
            tier: "silver",
            defaultAddress: {
                postalCode: "5300001",
                prefecture: "大阪府",
                city: "大阪市北区",
                line1: "梅田2-4-9",
                line2: ""
            },
            favoriteCategoryIds: ["CAT-PANTRY", "CAT-DAILY"]
        }
    },
    loyalty: {
        C001: { customerId: "C001", tier: "gold", points: 4820, nextTier: null, nextTierRequiredPoints: null, perks: ["送料無料", "先行セール", "誕生月クーポン"] },
        C002: { customerId: "C002", tier: "silver", points: 1840, nextTier: "gold", nextTierRequiredPoints: 3000, perks: ["限定クーポン", "レビュー特典"] }
    },
    wishlist: {
        C001: ["G009", "G010"],
        C002: ["G008"]
    },
    orders: [
        {
            orderId: "O1001",
            customerId: "C001",
            orderedAt: "2026-03-28T10:30:00+09:00",
            status: "shipped",
            paymentMethod: "credit_card",
            shippingAddress: { postalCode: "1500001", prefecture: "東京都", city: "渋谷区", line1: "神宮前1-2-3", line2: "Apt 502" },
            items: [
                { itemId: "G005", quantity: 2, unitPrice: 260 },
                { itemId: "G006", quantity: 1, unitPrice: 150 },
                { itemId: "G010", quantity: 1, unitPrice: 540 }
            ],
            shippingFee: 0,
            discountTotal: 104,
            total: 1106
        },
        {
            orderId: "O1002",
            customerId: "C002",
            orderedAt: "2026-03-20T18:20:00+09:00",
            status: "delivered",
            paymentMethod: "cod",
            shippingAddress: { postalCode: "5300001", prefecture: "大阪府", city: "大阪市北区", line1: "梅田2-4-9", line2: "" },
            items: [
                { itemId: "G008", quantity: 2, unitPrice: 298 },
                { itemId: "G007", quantity: 1, unitPrice: 380 }
            ],
            shippingFee: 480,
            discountTotal: 0,
            total: 1456
        }
    ],
    reviews: {
        G005: [
            { reviewId: "R001", rating: 5, title: "コクが深い", comment: "野菜の甘みとよく合います。", author: "M.T", createdAt: "2026-03-14" },
            { reviewId: "R002", rating: 4, title: "家族向け", comment: "辛すぎず食べやすいです。", author: "K.S", createdAt: "2026-02-26" }
        ],
        G010: [
            { reviewId: "R003", rating: 5, title: "朝にちょうど良い", comment: "香りが良く毎朝飲んでいます。", author: "Y.N", createdAt: "2026-03-01" }
        ],
        G008: [
            { reviewId: "R004", rating: 4, title: "油落ちが良い", comment: "少量で十分に落ちます。", author: "H.K", createdAt: "2026-01-18" }
        ]
    },
    paymentMethods: [
        { code: "credit_card", label: "クレジットカード", fees: 0 },
        { code: "apple_pay", label: "Apple Pay", fees: 0 },
        { code: "cod", label: "代金引換", fees: 330 },
        { code: "bank_transfer", label: "銀行振込", fees: 0 }
    ],
    returnPolicy: {
        default: {
            days: 14,
            openedPackageAllowed: false,
            notes: ["到着後14日以内に申請してください。", "生鮮食品は品質不良時を除き返品不可です。"]
        },
        byCategory: {
            "CAT-FRESH": { days: 2, openedPackageAllowed: false, notes: ["生鮮食品は到着翌日までにご連絡ください。"] },
            "CAT-BEAUTY": { days: 30, openedPackageAllowed: false, notes: ["未開封品のみ返品可能です。"] }
        }
    },
    deliverySlots: {
        default: ["08:00-12:00", "12:00-14:00", "14:00-16:00", "16:00-18:00", "18:00-20:00"],
        remote: ["12:00-14:00", "16:00-18:00"]
    },
    cart: {
        cartId: "CART-001",
        customerId: "C001",
        couponCode: null,
        items: [
            { itemId: "G005", quantity: 1 },
            { itemId: "G006", quantity: 1 }
        ]
    }
};

function createLookupMap(list, key) {
    return new Map(list.map((entry) => [entry[key], entry]));
}

function normalizeText(value) {
    return String(value || "").trim().toLowerCase();
}

function cloneJson(value) {
    return JSON.parse(JSON.stringify(value));
}

function computeAverageRating(reviews) {
    if (!reviews || reviews.length === 0) return null;
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return Number((total / reviews.length).toFixed(1));
}

function createMockGateway() {
    const categoryMap = createLookupMap(mockDatabase.categories, "categoryId");
    const brandMap = createLookupMap(mockDatabase.brands, "brandId");
    const productMap = createLookupMap(mockDatabase.products, "itemId");

    function enrichProduct(product) {
        if (!product) return null;
        const reviews = mockDatabase.reviews[product.itemId] || [];
        return {
            itemId: product.itemId,
            itemName: product.itemName,
            categoryId: product.categoryId,
            categoryName: categoryMap.get(product.categoryId)?.categoryName || null,
            brandId: product.brandId,
            brandName: brandMap.get(product.brandId)?.brandName || null,
            unitPrice: product.unitPrice,
            unit: product.unit,
            stock: product.stock,
            tags: product.tags,
            description: product.description,
            featured: product.featured,
            averageRating: computeAverageRating(reviews),
            reviewCount: reviews.length
        };
    }

    function getCustomerTier(customerTier) {
        const normalized = normalizeText(customerTier);
        if (["gold", "silver", "bronze"].includes(normalized)) return normalized;
        return "bronze";
    }

    function getCouponByCode(couponCode) {
        return mockDatabase.coupons.find((coupon) => coupon.couponCode === couponCode) || null;
    }

    function calculateLine(itemId, quantity, customerTier) {
        const product = productMap.get(itemId);
        if (!product) return null;

        const tier = getCustomerTier(customerTier);
        const tierDiscountRate = tier === "gold" ? 0.1 : tier === "silver" ? 0.05 : 0;
        const bulkDiscountRate = quantity >= 10 ? 0.08 : quantity >= 5 ? 0.05 : 0;
        const appliedDiscountRate = Math.min(0.25, tierDiscountRate + bulkDiscountRate);
        const unitPrice = product.unitPrice;
        const originalSubtotal = unitPrice * quantity;
        const discountAmount = Math.round(originalSubtotal * appliedDiscountRate);
        const subtotal = originalSubtotal - discountAmount;

        return {
            itemId,
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

    function summarizeCart() {
        const customerTier = mockDatabase.customerProfiles[mockDatabase.cart.customerId]?.tier || "bronze";
        const lines = mockDatabase.cart.items
            .map((item) => calculateLine(item.itemId, item.quantity, customerTier))
            .filter(Boolean);
        const subtotal = lines.reduce((sum, line) => sum + line.subtotal, 0);
        const originalSubtotal = lines.reduce((sum, line) => sum + line.originalSubtotal, 0);
        const lineDiscountTotal = lines.reduce((sum, line) => sum + line.discountAmount, 0);
        const coupon = mockDatabase.cart.couponCode ? getCouponByCode(mockDatabase.cart.couponCode) : null;
        const couponDiscount = coupon && subtotal >= coupon.minTotal
            ? coupon.discountType === "fixed"
                ? coupon.discountValue
                : Math.round(subtotal * (coupon.discountValue / 100))
            : 0;
        const shippingFee = subtotal >= 3500 ? 0 : 550;

        return {
            cartId: mockDatabase.cart.cartId,
            customerId: mockDatabase.cart.customerId,
            couponCode: mockDatabase.cart.couponCode,
            items: lines,
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

    const catalogService = {
        async searchProducts({ query, categoryId, brandId, limit }) {
            const normalizedQuery = normalizeText(query);
            return mockDatabase.products
                .filter((product) => {
                    const matchesQuery = !normalizedQuery || [
                        product.itemName,
                        product.description,
                        ...(product.tags || []),
                        categoryMap.get(product.categoryId)?.categoryName,
                        brandMap.get(product.brandId)?.brandName
                    ].some((value) => normalizeText(value).includes(normalizedQuery));
                    const matchesCategory = !categoryId || product.categoryId === categoryId;
                    const matchesBrand = !brandId || product.brandId === brandId;
                    return matchesQuery && matchesCategory && matchesBrand;
                })
                .slice(0, limit)
                .map(enrichProduct);
        },
        async getProductDetails(itemId) {
            return enrichProduct(productMap.get(itemId));
        },
        async listCategories() {
            return mockDatabase.categories.map((category) => ({
                ...category,
                productCount: mockDatabase.products.filter((product) => product.categoryId === category.categoryId).length
            }));
        },
        async getCategoryProducts(categoryId, options = {}) {
            return mockDatabase.products
                .filter((product) => product.categoryId === categoryId)
                .slice(0, options.limit || 12)
                .map(enrichProduct);
        },
        async listBrands() {
            return mockDatabase.brands.map((brand) => ({
                ...brand,
                productCount: mockDatabase.products.filter((product) => product.brandId === brand.brandId).length
            }));
        },
        async getBrandProducts(brandId, options = {}) {
            return mockDatabase.products
                .filter((product) => product.brandId === brandId)
                .slice(0, options.limit || 12)
                .map(enrichProduct);
        },
        async getFeaturedProducts(options = {}) {
            return mockDatabase.featuredProductIds
                .map((itemId) => enrichProduct(productMap.get(itemId)))
                .filter(Boolean)
                .slice(0, options.limit || 6);
        },
        async getRecommendedProducts({ customerId, basedOnItemId, limit }) {
            let itemIds = [];
            if (basedOnItemId) {
                itemIds = mockDatabase.recommendationMap[basedOnItemId] || mockDatabase.recommendationMap.default;
            } else if (customerId) {
                const profile = mockDatabase.customerProfiles[customerId];
                const favoriteCategories = profile?.favoriteCategoryIds || [];
                itemIds = mockDatabase.products
                    .filter((product) => favoriteCategories.includes(product.categoryId))
                    .map((product) => product.itemId);
                if (itemIds.length === 0) {
                    itemIds = mockDatabase.recommendationMap.default;
                }
            }

            return itemIds
                .slice(0, limit || 6)
                .map((itemId) => enrichProduct(productMap.get(itemId)))
                .filter(Boolean);
        }
    };

    const pricingService = {
        async getPriceQuote({ itemId, quantity, customerTier }) {
            return calculateLine(itemId, quantity, customerTier);
        },
        async getBulkPriceQuote({ items, customerTier, couponCode }) {
            const lines = items
                .map((item) => calculateLine(item.itemId, item.quantity, customerTier))
                .filter(Boolean);
            const subtotal = lines.reduce((sum, line) => sum + line.subtotal, 0);
            const coupon = couponCode ? getCouponByCode(couponCode) : null;
            const couponDiscount = coupon && subtotal >= coupon.minTotal
                ? coupon.discountType === "fixed"
                    ? coupon.discountValue
                    : Math.round(subtotal * (coupon.discountValue / 100))
                : 0;

            return {
                customerTier: getCustomerTier(customerTier),
                couponCode: couponCode || null,
                items: lines,
                summary: {
                    subtotal,
                    couponDiscount,
                    grandTotal: Math.max(0, subtotal - couponDiscount)
                }
            };
        },
        async getAvailableCoupons({ customerTier }) {
            const tier = getCustomerTier(customerTier);
            return mockDatabase.coupons.filter((coupon) => coupon.eligibleTiers.includes(tier));
        }
    };

    const inventoryService = {
        async getInventoryStatus(itemId) {
            const product = productMap.get(itemId);
            if (!product) return null;
            return {
                itemId,
                stock: product.stock,
                availability: product.stock > 50 ? "in_stock" : product.stock > 10 ? "limited" : "low_stock",
                estimatedRestockDays: product.stock > 10 ? 0 : 5
            };
        }
    };

    const cartService = {
        async getCart() {
            return summarizeCart();
        },
        async addItemToCart({ itemId, quantity }) {
            if (!productMap.has(itemId)) {
                return { error: `商品ID「${itemId}」は見つかりませんでした。` };
            }

            const existingItem = mockDatabase.cart.items.find((item) => item.itemId === itemId);
            if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                mockDatabase.cart.items.push({ itemId, quantity });
            }

            return summarizeCart();
        },
        async updateCartItemQuantity({ itemId, quantity }) {
            const item = mockDatabase.cart.items.find((entry) => entry.itemId === itemId);
            if (!item) {
                return { error: `カートに itemId「${itemId}」は存在しません。` };
            }

            if (quantity === 0) {
                mockDatabase.cart.items = mockDatabase.cart.items.filter((entry) => entry.itemId !== itemId);
            } else {
                item.quantity = quantity;
            }

            return summarizeCart();
        },
        async removeItemFromCart({ itemId }) {
            mockDatabase.cart.items = mockDatabase.cart.items.filter((entry) => entry.itemId !== itemId);
            return summarizeCart();
        },
        async applyCouponToCart({ couponCode }) {
            const coupon = getCouponByCode(couponCode);
            if (!coupon) {
                return { error: `couponCode「${couponCode}」は利用できません。` };
            }

            mockDatabase.cart.couponCode = couponCode;
            return summarizeCart();
        }
    };

    const logisticsService = {
        async estimateShippingFee({ postalCode, prefecture, shippingMethod, cartTotal }) {
            const normalizedMethod = normalizeText(shippingMethod) || "standard";
            const isRemote = ["北海道", "沖縄県"].includes(prefecture);
            const baseFee = normalizedMethod === "express" ? 880 : 550;
            const remoteSurcharge = isRemote ? 420 : 0;
            const freeShippingThreshold = normalizedMethod === "express" ? 6000 : 3500;
            const shippingFee = cartTotal >= freeShippingThreshold ? 0 : baseFee + remoteSurcharge;

            return {
                postalCode,
                prefecture,
                shippingMethod: normalizedMethod,
                shippingFee,
                freeShippingThreshold,
                remoteSurcharge
            };
        },
        async getDeliverySlots({ prefecture }) {
            return ["北海道", "沖縄県"].includes(prefecture)
                ? mockDatabase.deliverySlots.remote
                : mockDatabase.deliverySlots.default;
        },
        async validateShippingAddress(address) {
            const isPostalCodeValid = /^\d{7}$/.test(address.postalCode);
            const warnings = [];
            if (!isPostalCodeValid) {
                warnings.push("postalCode はハイフンなし7桁で指定してください。");
            }
            if (address.line1.length < 3) {
                warnings.push("line1 が短すぎる可能性があります。");
            }

            return {
                isValid: isPostalCodeValid && warnings.length === 0,
                normalizedAddress: {
                    postalCode: address.postalCode,
                    prefecture: address.prefecture,
                    city: address.city,
                    line1: address.line1,
                    line2: address.line2 || ""
                },
                warnings
            };
        }
    };

    const customerService = {
        async getCustomerProfile(customerId) {
            return cloneJson(mockDatabase.customerProfiles[customerId] || null);
        },
        async getLoyaltySummary(customerId) {
            return cloneJson(mockDatabase.loyalty[customerId] || null);
        },
        async getWishlist(customerId) {
            const itemIds = mockDatabase.wishlist[customerId] || [];
            return {
                customerId,
                items: itemIds.map((itemId) => enrichProduct(productMap.get(itemId))).filter(Boolean)
            };
        },
        async addItemToWishlist({ customerId, itemId }) {
            if (!mockDatabase.customerProfiles[customerId]) {
                return { error: `customerId「${customerId}」は見つかりませんでした。` };
            }
            if (!productMap.has(itemId)) {
                return { error: `商品ID「${itemId}」は見つかりませんでした。` };
            }

            const wishlist = mockDatabase.wishlist[customerId] || [];
            if (!wishlist.includes(itemId)) {
                wishlist.push(itemId);
            }
            mockDatabase.wishlist[customerId] = wishlist;

            return {
                customerId,
                items: wishlist.map((currentItemId) => enrichProduct(productMap.get(currentItemId))).filter(Boolean)
            };
        }
    };

    const orderService = {
        async getOrderHistory(customerId, options = {}) {
            return mockDatabase.orders
                .filter((order) => order.customerId === customerId)
                .slice(0, options.limit || 5)
                .map((order) => ({
                    orderId: order.orderId,
                    orderedAt: order.orderedAt,
                    status: order.status,
                    total: order.total,
                    itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0)
                }));
        },
        async getOrderDetails(orderId) {
            const order = mockDatabase.orders.find((entry) => entry.orderId === orderId);
            if (!order) return null;

            return {
                ...cloneJson(order),
                items: order.items.map((item) => ({
                    ...item,
                    itemName: productMap.get(item.itemId)?.itemName || null
                }))
            };
        }
    };

    const contentService = {
        async getProductReviews(itemId, options = {}) {
            return (mockDatabase.reviews[itemId] || []).slice(0, options.limit || 5);
        },
        async getPaymentMethods() {
            return cloneJson(mockDatabase.paymentMethods);
        },
        async getReturnPolicy({ categoryId }) {
            return cloneJson(mockDatabase.returnPolicy.byCategory[categoryId] || mockDatabase.returnPolicy.default);
        }
    };

    const internalOpsService = {
        async getEmployeeInfo(employeeId) {
            return cloneJson(mockDatabase.employees[employeeId] || null);
        },
        async getRecipeByKeyword(keyword) {
            const normalizedKeyword = keyword.trim();
            return cloneJson(
                mockDatabase.recipes.find((entry) => entry.keywords.some((value) => normalizedKeyword.includes(value))) || null
            );
        },
        async getItemInfoById(itemId) {
            const product = productMap.get(itemId);
            if (!product) return null;
            return {
                id: product.itemId,
                name: product.itemName,
                categoryId: product.categoryId,
                brandId: product.brandId,
                unitPrice: product.unitPrice,
                unit: product.unit,
                stock: product.stock,
                tags: product.tags
            };
        }
    };

    return {
        getEmployeeInfo: internalOpsService.getEmployeeInfo,
        getRecipeByKeyword: internalOpsService.getRecipeByKeyword,
        getItemInfoById: internalOpsService.getItemInfoById,
        searchProducts: catalogService.searchProducts,
        getProductDetails: catalogService.getProductDetails,
        listCategories: catalogService.listCategories,
        getCategoryProducts: catalogService.getCategoryProducts,
        listBrands: catalogService.listBrands,
        getBrandProducts: catalogService.getBrandProducts,
        getFeaturedProducts: catalogService.getFeaturedProducts,
        getRecommendedProducts: catalogService.getRecommendedProducts,
        getPriceQuote: pricingService.getPriceQuote,
        getBulkPriceQuote: pricingService.getBulkPriceQuote,
        getAvailableCoupons: pricingService.getAvailableCoupons,
        getInventoryStatus: inventoryService.getInventoryStatus,
        getCart: cartService.getCart,
        addItemToCart: cartService.addItemToCart,
        updateCartItemQuantity: cartService.updateCartItemQuantity,
        removeItemFromCart: cartService.removeItemFromCart,
        applyCouponToCart: cartService.applyCouponToCart,
        estimateShippingFee: logisticsService.estimateShippingFee,
        getDeliverySlots: logisticsService.getDeliverySlots,
        validateShippingAddress: logisticsService.validateShippingAddress,
        getCustomerProfile: customerService.getCustomerProfile,
        getLoyaltySummary: customerService.getLoyaltySummary,
        getWishlist: customerService.getWishlist,
        addItemToWishlist: customerService.addItemToWishlist,
        getOrderHistory: orderService.getOrderHistory,
        getOrderDetails: orderService.getOrderDetails,
        getProductReviews: contentService.getProductReviews,
        getPaymentMethods: contentService.getPaymentMethods,
        getReturnPolicy: contentService.getReturnPolicy
    };
}

function createMixedGateway(options) {
    const mockGateway = createMockGateway();
    const isLocalMode = options.mode === "local";

    return {
        ...mockGateway,
        async getEmployeeInfo(employeeId) {
            console.log("[Gateway] source=external getEmployeeInfo", { mode: options.mode, employeeId });
            const employee = await options.employeeApi.getEmployeeInfo(employeeId);
            if (!employee) return null;

            if (isLocalMode && (!employee.name || !employee.department)) {
                throw new Error("Local validation failed: employee response shape is invalid");
            }

            return {
                employeeId,
                name: employee.name,
                department: employee.department,
                role: employee.role || "external-user",
                email: employee.email || null
            };
        },
        async getRecipeByKeyword(keyword) {
            console.log("[Gateway] source=external getRecipeByKeyword", { mode: options.mode, keyword: keyword?.trim?.() ?? keyword });
            const recipe = await options.recipeApi.getRecipeByKeyword(keyword);
            if (!recipe) return null;

            if (isLocalMode && !recipe?.recipe?.requiredIngredients && !recipe?.recipe?.ingredients) {
                throw new Error("Local validation failed: recipe response shape is invalid");
            }

            return {
                id: recipe.recipe?.recipeId || recipe.recipeId || recipe.id,
                name: recipe.recipe?.recipeName || recipe.recipeName || recipe.name,
                servings: recipe.recipe?.servings || recipe.servings,
                ingredients: recipe.recipe?.requiredIngredients || recipe.requiredIngredients || recipe.ingredients || []
            };
        },
        async getItemInfoById(itemId) {
            console.log("[Gateway] source=external getItemInfoById", { mode: options.mode, itemId });
            const item = await options.itemApi.getItemInfoById(itemId);
            if (!item) return null;

            if (isLocalMode && (typeof item.unitPrice !== "number" || typeof item.stock !== "number")) {
                throw new Error("Local validation failed: item response shape is invalid");
            }

            return {
                id: item.itemId || item.id,
                name: item.itemName || item.name,
                categoryId: item.categoryId || null,
                brandId: item.brandId || null,
                unitPrice: item.unitPrice,
                unit: item.unit,
                stock: item.stock,
                tags: item.tags || []
            };
        }
    };
}

export function createExternalApiGateway(options) {
    console.log("[Gateway] createExternalApiGateway", { mode: options.mode });

    if (options.mode === "mock") {
        return createMockGateway();
    }

    return createMixedGateway(options);
}
