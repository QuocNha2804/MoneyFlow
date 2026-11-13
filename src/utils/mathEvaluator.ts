/**
 * Bộ tính biểu thức an toàn (không dùng eval) cho NumericKeyboard.
 * Hỗ trợ: + - × ÷ (và * /), số thập phân, ưu tiên nhân chia trước cộng trừ.
 * VD: "35000*2+15000" → 85000
 */

export const OPERATORS = ['+', '-', '×', '÷'] as const;
export type Operator = (typeof OPERATORS)[number];

function normalize(expr: string): string {
  return expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/,/g, '.').replace(/\s+/g, '');
}

type Token = { t: 'num'; v: number } | { t: 'op'; v: string };

function tokenize(expr: string): Token[] {
  const s = normalize(expr);
  const tokens: Token[] = [];
  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (/[0-9.]/.test(ch)) {
      let j = i;
      while (j < s.length && /[0-9.]/.test(s[j])) j++;
      const num = parseFloat(s.slice(i, j));
      tokens.push({ t: 'num', v: Number.isFinite(num) ? num : 0 });
      i = j;
    } else if ('+-*/'.includes(ch)) {
      // Dấu trừ đơn ngôi ở đầu hoặc sau toán tử
      const prev = tokens[tokens.length - 1];
      if (ch === '-' && (!prev || prev.t === 'op')) {
        let j = i + 1;
        while (j < s.length && /[0-9.]/.test(s[j])) j++;
        const num = parseFloat(s.slice(i, j));
        tokens.push({ t: 'num', v: Number.isFinite(num) ? num : 0 });
        i = j;
      } else {
        tokens.push({ t: 'op', v: ch });
        i++;
      }
    } else {
      i++;
    }
  }
  // Bỏ toán tử thừa ở cuối
  while (tokens.length && tokens[tokens.length - 1].t === 'op') tokens.pop();
  return tokens;
}

export function evaluateExpression(expr: string): number {
  const tokens = tokenize(expr);
  if (!tokens.length) return 0;
  // Pass 1: * và /
  const stack: Token[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const tk = tokens[i];
    if (tk.t === 'op' && (tk.v === '*' || tk.v === '/')) {
      const left = stack.pop();
      const right = tokens[++i];
      if (!left || left.t !== 'num' || !right || right.t !== 'num') continue;
      const v = tk.v === '*' ? left.v * right.v : right.v === 0 ? 0 : left.v / right.v;
      stack.push({ t: 'num', v });
    } else {
      stack.push(tk);
    }
  }
  // Pass 2: + và -
  let result = 0;
  let op = '+';
  for (const tk of stack) {
    if (tk.t === 'op') op = tk.v;
    else result = op === '+' ? result + tk.v : result - tk.v;
  }
  return Number.isFinite(result) ? result : 0;
}

export function hasOperator(expr: string): boolean {
  // Bỏ qua dấu trừ ở đầu
  return /[+\-×÷*/]/.test(expr.slice(1));
}

/** Định dạng biểu thức để hiển thị: nhóm hàng nghìn cho từng số hạng */
export function prettyExpression(expr: string, thousandSep = '.', decimalSep = ','): string {
  return expr.replace(/\d+(\.\d*)?/g, (m) => {
    const [i, d] = m.split('.');
    const grouped = i.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSep);
    return d !== undefined ? `${grouped}${decimalSep}${d}` : grouped;
  });
}
