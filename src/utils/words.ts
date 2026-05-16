const SEPARATOR = /[\n,，、\s]+/;

export function splitWords(text: string): string[] {
  return text
    .split(SEPARATOR)
    .map((w) => w.trim())
    .filter((w) => w.length > 0);
}
