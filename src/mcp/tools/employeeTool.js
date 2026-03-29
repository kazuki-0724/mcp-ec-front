export const EMPLOYEE_TOOL_NAME = "get_employee_info";

export async function handleEmployeeTool(args, usecases) {
    return usecases.getEmployeeInfo({ employeeId: args?.employeeId });
}
