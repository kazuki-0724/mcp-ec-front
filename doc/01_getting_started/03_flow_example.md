# Curry Ingredients E2E Flow

この文書は、ユーザが「カレーの具材を教えて」と入力してから、
最終レスポンスが UI に表示されるまでを、関数・データ構造レベルで追跡します。

## 0. 前提

- チャット送信先は `/api/chat`
- 実行モードは `mock` / `local` / `production` のいずれか
- Gemini は tool 呼び出しを返す場合と返さない場合がある

このケースでは通常、`get_recipe_by_keyword` が呼ばれ、必要に応じて
`get_item_info_by_id` が追加で呼ばれます。

## 1. フロントエンド入力から送信まで

1. ユーザが入力欄に「カレーの具材を教えて」と入力して Enter または送信ボタンを押す。
2. [src/components/ChatInputBar.vue](../../src/components/ChatInputBar.vue) の `onKeydown` が `send` イベントを emit する。
3. [src/App.vue](../../src/App.vue) の `handleSendPrompt` が [src/composables/useChatState.js](../../src/composables/useChatState.js) の `sendPrompt` を呼ぶ。
4. `sendPrompt` は次を実行する。
   - `trimmedPrompt` を生成
   - ユーザメッセージを `messages` に追加
   - AI の仮メッセージ (`考え中...`) を追加
   - `conversationHistory` スナップショットを正規化
5. [src/services/chatApi.js](../../src/services/chatApi.js) の `postChat(prompt, history)` が呼ばれ、HTTP POST で `/api/chat` に送信される。

送信 payload は次の形です。

```json
{
  "prompt": "カレーの具材を教えて",
  "conversationHistory": [
    {
      "turnId": 1,
      "userPrompt": "...",
      "assistantResponse": "...",
      "toolExecutions": [],
      "calledTools": [],
      "timestamp": "..."
    }
  ]
}
```

## 2. Express での受信と Chat Controller 起動

1. [src/server/createApp.js](../../src/server/createApp.js) が `/api/chat` を [src/server/chat/createChatController.js](../../src/server/chat/createChatController.js) にルーティングする。
2. `chatController(req, res)` が `prompt` と `conversationHistory` を取り出す。
3. `sanitizeConversationHistory(conversationHistory)` を実行する。
   - 実装: [src/shared/conversation/history.js](../../src/shared/conversation/history.js)
   - 主な整形内容:
     - 最新 8 ターンに制限
     - `userPrompt` / `assistantResponse` を文字数制限で trim
     - `toolExecutions` を 1 ターン最大 6 件に制限
     - 空ターン除外
4. `prompt` が空なら 400 を返す。今回は有効なので続行する。

## 3. MCP tool 定義の取得と Gemini 初回呼び出し

1. `mcpClient.listTools()` で MCP サーバーの tool 一覧を取得する。
2. 取得結果を `functionDeclarations` に変換し Gemini に渡す。
   - `name`, `description`, `inputSchema` が使用される
   - 定義元: [src/mcp/registry/toolRegistry.js](../../src/mcp/registry/toolRegistry.js)
3. `model.startChat({ history: buildGeminiHistory(...) })` で会話を開始する。
4. `sendMessageWithRetry(chat, prompt)` で初回プロンプトを送る。
   - 429/503/high demand は指数バックオフ再試行
   - 既定: `maxRetries=3`, `baseDelayMs=800`

## 4. Function Calling ループ

`MAX_TOOL_ROUNDS=5` の範囲で次を繰り返す。

1. `response.functionCalls()` を取得
2. 呼び出しシグネチャ `toolName:JSON.stringify(args)` を作成
3. 同一シグネチャ反復のみになったらループ防止で中断
4. 各 function call について:
   - tool 名が listTools 結果に存在するか確認
   - 未知なら functionResponse に error を詰めて継続
   - 既知なら `mcpClient.callTool({ name, arguments })` を実行
5. tool の戻り値 (`content[0].text`) を JSON parse し `toolExecutions` に記録
6. その tool 結果を functionResponse として Gemini に返す
7. 次ラウンドへ

## 5. get_recipe_by_keyword 実行の内部経路

Gemini が通常この質問で要求するのは `get_recipe_by_keyword` です。

1. 親プロセス -> MCP client
   - [src/server/chat/createChatController.js](../../src/server/chat/createChatController.js)
2. MCP client -> MCP child process (stdio)
   - [src/server/mcp/createMcpClient.js](../../src/server/mcp/createMcpClient.js)
3. MCP server が `CallToolRequestSchema` を受け取り handler を解決
   - [src/mcp/server.js](../../src/mcp/server.js)
4. `toolRegistry.get('get_recipe_by_keyword')` で handler を引く
   - [src/mcp/registry/toolRegistry.js](../../src/mcp/registry/toolRegistry.js)
5. 実 handler は `usecases.get_recipe_by_keyword`
   - [src/usecases/commerceUseCases.js](../../src/usecases/commerceUseCases.js)
6. usecase が `keyword` を検証し `gateway.getRecipeByKeyword(keyword)` を呼ぶ
7. gateway が mode に応じた data source へ委譲
   - 組み立て: [src/app/index.js](../../src/app/index.js), [src/gateways/externalApiGateway.js](../../src/gateways/externalApiGateway.js)

### mock mode の場合

- [src/gateways/mock/createMockDataSource.js](../../src/gateways/mock/createMockDataSource.js)
  の `getRecipeByKeyword` が実行される
- [src/gateways/mock/mockDatabase.js](../../src/gateways/mock/mockDatabase.js)
  の recipes から「カレー」に一致するレシピを返す

### local/production の場合

- GraphQL 実装が存在すれば [src/gateways/external/createGraphqlCommerceApis.js](../../src/gateways/external/createGraphqlCommerceApis.js)
  の `recipeApi.getRecipeByKeyword` が実行される
- local では未実装エラー (`EXTERNAL_API_NOT_IMPLEMENTED`) のみ mock fallback 対象

usecase の戻り値は次の形です。

```json
{
  "keyword": "カレー",
  "recipe": {
    "recipeId": "RECIPE001",
    "recipeName": "カレー",
    "servings": 4,
    "requiredIngredients": [
      { "ingredientName": "玉ねぎ", "requiredQty": "2個", "itemId": "G001" }
    ]
  },
  "nextActionHint": "requiredIngredients[].itemId を使って get_item_info_by_id を呼び出してください。"
}
```

## 6. 追加ツール呼び出し (任意)

Gemini が `nextActionHint` に従うと、`get_item_info_by_id` を複数回呼び、
具材ごとの商品名・価格・在庫を補足する。

この場合 `toolExecutions` には、以下が順に蓄積される。

- `get_recipe_by_keyword` 1件
- `get_item_info_by_id` N件

## 7. 最終レスポンス生成と HTTP 応答

1. function call がなくなったら `response.text()` を最終文面として採用
2. text が空なら tool 実行結果連結を fallback 文面として採用
3. `buildConversationTurn(...)` で今回ターンを生成
4. レスポンス JSON を返す

返却フィールド:

- `text`: 最終回答文
- `toolExecutions`: 実行ツール履歴
- `conversationTurn`: 今回ターン
- `conversationRecord`: 履歴 + 今回ターン
- `debug`: mode / endpoint / calledTools

## 8. フロントエンドでの表示更新

1. `postChat` の戻り値を [src/composables/useChatState.js](../../src/composables/useChatState.js) が受け取る
2. `conversationHistory` を `data.conversationRecord` で更新
3. 仮メッセージ (`考え中...`) を最終 `data.text` へ置換
4. `loading=false` に変更して表示完了

## 9. デバッグ時の確認ポイント

1. 親プロセスの mode/endpoint: `/api/dev/external-target`
2. 親子整合: `/api/dev/mcp-runtime-diagnostics`
3. local/prod の GraphQL 直接検証: `/api/dev/graphql-probe`

## 関連ドキュメント

- 章トップ: [README.md](README.md)
- Function Calling 全体: [03_function_calling.md](03_function_calling.md)
- リクエスト全体像: [../02_architecture/02_request_flow.md](../02_architecture/02_request_flow.md)