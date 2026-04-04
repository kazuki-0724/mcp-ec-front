import { fetchJson } from '../infra/http/fetchJson.js';

export async function postChat(prompt, conversationHistory = []) {
  return fetchJson('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, conversationHistory })
  });
}
