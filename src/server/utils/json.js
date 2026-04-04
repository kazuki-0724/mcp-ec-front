export function tryParseJson(text) {
  if (typeof text !== 'string') return null;

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}