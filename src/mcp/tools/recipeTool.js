export const RECIPE_TOOL_NAME = "get_recipe_by_keyword";

export async function handleRecipeTool(args, usecases) {
    return usecases.getRecipeByKeyword({ keyword: args?.keyword });
}
