export async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await res.json() : { error: await res.text() };

  if (!res.ok) {
    throw new Error(payload?.error || `APIエラーが発生しました。status=${res.status}`);
  }

  return payload;
}