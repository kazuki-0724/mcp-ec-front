export function createGetRecipeByKeywordUseCase({ gateway }) {
    return async function getRecipeByKeyword(params = {}) {
        const keyword = params.keyword;
        if (!keyword) {
            return { error: "キーワードが指定されていません。" };
        }

        const recipe = await gateway.getRecipeByKeyword(keyword);
        if (!recipe) {
            return { error: `キーワード「${keyword}」に対応するレシピが見つかりませんでした。` };
        }

        return {
            keyword: keyword.trim(),
            recipe: {
                recipeId: recipe.id,
                recipeName: recipe.name,
                servings: recipe.servings,
                requiredIngredients: recipe.ingredients
            },
            nextActionHint: "requiredIngredients[].itemId を使って get_item_info_by_id を呼び出してください。"
        };
    };
}
