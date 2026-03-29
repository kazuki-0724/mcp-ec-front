import { AppError } from "../../shared/errors/AppError.js";

export function createEmployeeApi(httpClient, apiConfig) {
    const EMPLOYEE_QUERY = `
        query EmployeeById($employeeId: ID!) {
            employeeById(employeeId: $employeeId) {
                employeeId
                name
                department
            }
        }
    `;

    return {
        async getEmployeeInfo(employeeId) {
            if (!apiConfig.endpoint) {
                throw new AppError("GRAPHQL_API_ENDPOINT is not configured", {
                    code: "GRAPHQL_API_CONFIG_MISSING",
                    status: 500
                });
            }

            const headers = {
                "X-User-Id": apiConfig.userId || "mcp-server"
            };
            if (apiConfig.token) {
                headers.Authorization = `Bearer ${apiConfig.token}`;
            }

            const payload = {
                operationName: "EmployeeById",
                query: EMPLOYEE_QUERY,
                variables: { employeeId }
            };

            const response = await httpClient.postJson(apiConfig.endpoint, {
                headers,
                body: JSON.stringify(payload)
            });

            if (Array.isArray(response?.errors) && response.errors.length > 0) {
                throw new AppError(response.errors[0]?.message || "GraphQL employee query failed", {
                    code: "GRAPHQL_QUERY_ERROR",
                    status: 502,
                    details: response.errors
                });
            }

            return response?.data?.employeeById || null;
        }
    };
}
