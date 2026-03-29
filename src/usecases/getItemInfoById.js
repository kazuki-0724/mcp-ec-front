export function createGetItemInfoByIdUseCase({ gateway }) {
    return async function getItemInfoById(params = {}) {
        const itemId = params.itemId;
        if (!itemId) {
            return { error: "商品IDが指定されていません。" };
        }

        const item = await gateway.getItemInfoById(itemId);
        if (!item) {
            return { error: `商品ID「${itemId}」は見つかりませんでした。` };
        }

        return {
            itemId: item.id,
            itemName: item.name,
            unitPrice: item.unitPrice,
            unit: item.unit,
            stock: item.stock
        };
    };
}
