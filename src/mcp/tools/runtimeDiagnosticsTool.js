export const RUNTIME_DIAGNOSTICS_TOOL_NAME = "get_runtime_diagnostics";

export async function handleRuntimeDiagnosticsTool(_args, usecases) {
    return usecases.getRuntimeDiagnostics();
}