export async function postChat(prompt, conversationHistory = []) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, conversationHistory })
  });

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await res.json() : { error: await res.text() };

  if (!res.ok) {
    const message = data?.error || `APIエラーが発生しました。status=${res.status}`;
    throw new Error(message);
  }

  return data;
}
