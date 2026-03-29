import { AppError } from "../../shared/errors/AppError.js";

export function createEmployeeApi(httpClient, apiConfig) {
    return {
        async getEmployeeInfo(employeeId) {
            if (!apiConfig.baseUrl) {
                throw new AppError("EMPLOYEE_API_BASE_URL is not configured", {
                    code: "EMPLOYEE_API_CONFIG_MISSING",
                    status: 500
                });
            }

            const url = `${apiConfig.baseUrl.replace(/\/$/, "")}/employees/${encodeURIComponent(employeeId)}`;
            const headers = apiConfig.token ? { Authorization: `Bearer ${apiConfig.token}` } : {};
            return httpClient.getJson(url, { headers });
        }
    };
}
