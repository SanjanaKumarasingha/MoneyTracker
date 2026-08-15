// Minimal safe arithmetic evaluator for the calculator keypad's "=" key.
// Client/src/components/record/RecordModal.tsx uses mathjs's `evaluate` for
// this; the keypad only ever produces a string built from digits and
// `+ - * / .`, so a small recursive-descent parser covers the same ground
// here without pulling in a full math library.
export function safeEvaluate(expression: string): number | null {
  const sanitized = expression.trim();
  if (!sanitized) return null;
  if (!/^[0-9+\-*/.\s]+$/.test(sanitized)) return null;

  let pos = 0;

  function peek(): string {
    return sanitized[pos];
  }

  function parseNumber(): number {
    const start = pos;
    while (pos < sanitized.length && /[0-9.]/.test(sanitized[pos])) pos++;
    const text = sanitized.slice(start, pos);
    if (!text || Number.isNaN(Number(text))) throw new Error('bad number');
    return Number(text);
  }

  function parseFactor(): number {
    if (peek() === '-') {
      pos++;
      return -parseFactor();
    }
    if (peek() === '+') {
      pos++;
      return parseFactor();
    }
    if (peek() === '(') {
      pos++;
      const value = parseExpression();
      if (peek() === ')') pos++;
      return value;
    }
    return parseNumber();
  }

  function parseTerm(): number {
    let value = parseFactor();
    while (pos < sanitized.length) {
      skipSpaces();
      const op = peek();
      if (op === '*' || op === '/') {
        pos++;
        skipSpaces();
        const rhs = parseFactor();
        value = op === '*' ? value * rhs : value / rhs;
      } else {
        break;
      }
      skipSpaces();
    }
    return value;
  }

  function parseExpression(): number {
    skipSpaces();
    let value = parseTerm();
    while (pos < sanitized.length) {
      skipSpaces();
      const op = peek();
      if (op === '+' || op === '-') {
        pos++;
        skipSpaces();
        const rhs = parseTerm();
        value = op === '+' ? value + rhs : value - rhs;
      } else {
        break;
      }
      skipSpaces();
    }
    return value;
  }

  function skipSpaces() {
    while (pos < sanitized.length && sanitized[pos] === ' ') pos++;
  }

  try {
    const result = parseExpression();
    if (pos !== sanitized.length || Number.isNaN(result) || !Number.isFinite(result)) {
      return null;
    }
    return result;
  } catch {
    return null;
  }
}
