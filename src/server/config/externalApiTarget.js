export function toBoolean(value, defaultValue = false) {
  if (value == null) return defaultValue;
  return new Set(['1', 'true', 'yes', 'on']).has(String(value).toLowerCase());
}

export function resolveExternalApiMode(env = process.env) {
  const modeRaw = (env.EXTERNAL_API_MODE || '').trim().toLowerCase();
  if (modeRaw === 'mock' || modeRaw === 'local' || modeRaw === 'production') {
    return modeRaw;
  }

  return toBoolean(env.USE_EXTERNAL_APIS, false) ? 'production' : 'mock';
}

export function summarizeExternalApiTarget(env = process.env) {
  const mode = resolveExternalApiMode(env);
  const endpoint = env.GRAPHQL_API_ENDPOINT || (mode === 'local' ? 'http://localhost:8081/graphql' : null);

  if (mode === 'mock') {
    return {
      mode,
      target: 'built-in mock data',
      endpoint: null,
      tokenConfigured: false,
      userId: null
    };
  }

  return {
    mode,
    target: 'graphql external api',
    endpoint,
    tokenConfigured: Boolean(env.GRAPHQL_API_TOKEN),
    userId: env.GRAPHQL_API_USER_ID || 'mcp-server'
  };
}

export function buildMcpChildEnv(externalApiTarget, env = process.env) {
  const childEnv = {
    ...env
  };

  if (externalApiTarget.mode) {
    childEnv.EXTERNAL_API_MODE = externalApiTarget.mode;
  }
  if (externalApiTarget.endpoint) {
    childEnv.GRAPHQL_API_ENDPOINT = externalApiTarget.endpoint;
  }
  if (env.GRAPHQL_API_USER_ID) {
    childEnv.GRAPHQL_API_USER_ID = env.GRAPHQL_API_USER_ID;
  }
  if (env.GRAPHQL_API_TOKEN) {
    childEnv.GRAPHQL_API_TOKEN = env.GRAPHQL_API_TOKEN;
  }

  return childEnv;
}

export const DEV_GRAPHQL_QUERIES = {
  employee: {
    operationName: 'EmployeeById',
    query: `
      query EmployeeById($employeeId: ID!) {
        employeeById(employeeId: $employeeId) {
          employeeId
          name
          department
        }
      }
    `
  },
  recipe: {
    operationName: 'RecipeByKeyword',
    query: `
      query RecipeByKeyword($keyword: String!) {
        recipeByKeyword(keyword: $keyword) {
          keyword
          nextActionHint
          recipe {
            recipeId
            recipeName
            servings
            requiredIngredients {
              ingredientName
              requiredQty
              itemId
            }
          }
        }
      }
    `
  },
  item: {
    operationName: 'ItemById',
    query: `
      query ItemById($itemId: ID!) {
        itemById(itemId: $itemId) {
          itemId
          itemName
          unitPrice
          unit
          stock
        }
      }
    `
  }
};

export function buildDevHeaders(env = process.env) {
  const headers = {
    'Content-Type': 'application/json',
    'X-User-Id': env.GRAPHQL_API_USER_ID || 'mcp-server'
  };

  if (env.GRAPHQL_API_TOKEN) {
    headers.Authorization = `Bearer ${env.GRAPHQL_API_TOKEN}`;
  }

  return headers;
}