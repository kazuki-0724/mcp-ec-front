export function createGetEmployeeInfoUseCase({ gateway }) {
    return async function getEmployeeInfo(params = {}) {
        const employeeId = params.employeeId;
        if (!employeeId) {
            return { error: "社員IDが指定されていません。" };
        }

        const employee = await gateway.getEmployeeInfo(employeeId);
        if (!employee) {
            return { error: "指定された社員IDは見つかりませんでした。" };
        }

        return {
            name: employee.name,
            department: employee.department
        };
    };
}
