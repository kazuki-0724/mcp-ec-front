export function createGetRuntimeDiagnosticsUseCase({ runtime }) {
    return async function getRuntimeDiagnostics() {
        return {
            processId: runtime.processId,
            cwd: runtime.cwd,
            startedAt: runtime.startedAt,
            externalApiMode: runtime.externalApiMode,
            gatewaySelection: runtime.externalApiMode === "mock" ? "mock" : "external",
            externalApi: {
                endpoint: runtime.externalApi?.graphql?.endpoint || null,
                tokenConfigured: Boolean(runtime.externalApi?.graphql?.token),
                userId: runtime.externalApi?.graphql?.userId || null
            },
            envSnapshot: runtime.envSnapshot
        };
    };
}