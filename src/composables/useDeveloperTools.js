import { ref } from 'vue';
import { fetchJson } from '../infra/http/fetchJson.js';

export function useDeveloperTools() {
  const loadingTarget = ref(false);
  const runningProbe = ref(false);
  const loadingRuntimeDiagnostics = ref(false);
  const devTarget = ref(null);
  const devProbeResult = ref('');
  const devProbeError = ref('');
  const probeKeyword = ref('カレー');
  const probeEmployeeId = ref('E001');
  const probeItemId = ref('G005');

  async function refreshDevTarget() {
    loadingTarget.value = true;
    devProbeError.value = '';

    try {
      devTarget.value = await fetchJson('/api/dev/external-target');
    } catch (error) {
      devProbeError.value = `target取得エラー: ${error.message}`;
    } finally {
      loadingTarget.value = false;
    }
  }

  async function runProbe(operation) {
    if (runningProbe.value) return;

    const variablesByOperation = {
      recipe: { keyword: probeKeyword.value.trim() || 'カレー' },
      employee: { employeeId: probeEmployeeId.value.trim() || 'E001' },
      item: { itemId: probeItemId.value.trim() || 'G005' }
    };

    runningProbe.value = true;
    devProbeError.value = '';

    try {
      const data = await fetchJson('/api/dev/graphql-probe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation,
          variables: variablesByOperation[operation]
        })
      });
      devProbeResult.value = JSON.stringify(data, null, 2);
    } catch (error) {
      devProbeError.value = `probeエラー: ${error.message}`;
    } finally {
      runningProbe.value = false;
    }
  }

  async function fetchRuntimeDiagnostics() {
    if (loadingRuntimeDiagnostics.value) return;

    loadingRuntimeDiagnostics.value = true;
    devProbeError.value = '';

    try {
      const data = await fetchJson('/api/dev/mcp-runtime-diagnostics');
      devProbeResult.value = JSON.stringify(data, null, 2);
    } catch (error) {
      devProbeError.value = `runtime diagnosticsエラー: ${error.message}`;
    } finally {
      loadingRuntimeDiagnostics.value = false;
    }
  }

  return {
    loadingTarget,
    runningProbe,
    loadingRuntimeDiagnostics,
    devTarget,
    devProbeResult,
    devProbeError,
    probeKeyword,
    probeEmployeeId,
    probeItemId,
    refreshDevTarget,
    runProbe,
    fetchRuntimeDiagnostics
  };
}