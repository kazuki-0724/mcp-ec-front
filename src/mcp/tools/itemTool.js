export const ITEM_TOOL_NAME = "get_item_info_by_id";

export async function handleItemTool(args, usecases) {
    return usecases.getItemInfoById({ itemId: args?.itemId });
}
