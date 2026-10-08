// Shared helpers (extracted from build-curriculum.mjs)
// ------------------------------------------------------------------ helpers
export const SUB = '₀₁₂₃₄₅₆₇₈₉';
export const ascii = (s) => s.replace(/[₀-₉]/g, (d) => String(SUB.indexOf(d)));
export const keyOf = (f) => ascii(f).replace(/\(s\)|\(l\)|\(g\)|\(aq\)|[()\s]/g, '').replace(/↑|↓/g, '');
export const norm = (s) => ascii(s).replace(/\s+/g, ' ').trim();

export function atoms(formula) {
  // supports parentheses, subscripts and hydrates with ·
  const f = ascii(formula).replace(/\((s|l|g|aq)\)/g, '').replace(/↑|↓/g, '').trim();
  const parts = f.split('·');
  const total = {};
  const add = (el, n) => { total[el] = (total[el] || 0) + n; };
  const parse = (str, mult) => {
    const stack = [{}];
    let i = 0;
    while (i < str.length) {
      const ch = str[i];
      if (ch === '(') { stack.push({}); i++; }
      else if (ch === ')' && stack.length < 2) { i++; }
      else if (ch === ')') {
        i++; let n = ''; while (/\d/.test(str[i] || '')) n += str[i++];
        const top = stack.pop(); const m = n ? +n : 1;
        for (const [k, v] of Object.entries(top)) stack[stack.length - 1][k] = (stack[stack.length - 1][k] || 0) + v * m;
      } else if (/[A-Z]/.test(ch)) {
        let el = ch; i++; while (/[a-z]/.test(str[i] || '')) el += str[i++];
        let n = ''; while (/\d/.test(str[i] || '')) n += str[i++];
        stack[stack.length - 1][el] = (stack[stack.length - 1][el] || 0) + (n ? +n : 1);
      } else i++;
    }
    for (const [k, v] of Object.entries(stack[0])) add(k, v * mult);
  };
  parts.forEach((p, idx) => {
    let m = 1; let body = p.trim();
    const lead = body.match(/^(\d+)(?=[A-Z(])/); if (idx > 0 && lead) { m = +lead[1]; body = body.slice(lead[0].length); }
    parse(body, m);
  });
  return total;
}
export const side = (terms) => terms.reduce((acc, t) => { for (const [k, v] of Object.entries(atoms(t.f))) acc[k] = (acc[k] || 0) + v * t.coef; return acc; }, {});
export const sameAtoms = (a, b) => { const ks = new Set([...Object.keys(a), ...Object.keys(b)]); return [...ks].every((k) => (a[k] || 0) === (b[k] || 0)); };

export function parseEq(raw) {
  if (!raw) return null;
  let s = raw.replace(/\s*\+\s*তাপ\s*$/, '').split('  (')[0].split(' (বইয়ে')[0].split(' ; ΔH')[0].replace(/\s+/g, ' ').trim();
  if (!s.includes('→') || /⁺|⁻|e⁻|·\+|\+\s*e/.test(s)) return null;
  const [l, r] = s.split('→');
  const mk = (str) => str.split(/\s\+\s/).map((t) => {
    const m = t.trim().match(/^(\d*)\s*(.+)$/); if (!m) return null;
    return { coef: m[1] ? +m[1] : 1, f: m[2].trim() };
  });
  const L = mk(l), R = mk(r);
  if (L.some((x) => !x) || R.some((x) => !x)) return null;
  return { text: s, L, R, balanced: sameAtoms(side(L), side(R)) };
}
export function splitEquations(raw) {
  if (!raw) return [];
  const parts = raw.split(/;|\n/).map((x) => x.trim()).filter((x) => x.includes('→'));
  return parts.length ? parts : [];
}
export const dH = (s) => { const m = (s || '').match(/ΔH\s*=\s*([−+-]?\s*[\d.]+)/); return m ? parseFloat(m[1].replace('−', '-').replace(/\s/g, '')) : null; };
export const PPT_COLORS = {
 AgCl: ['#f5f5f0', 'সাদা AgCl'], BaSO4: ['#f7f7f2', 'সাদা BaSO₄'], PbI2: ['#f4c430', 'হলুদ PbI₂'], CuOH2: ['#8fc4e8', 'নীল Cu(OH)₂'],
  AlOH3: ['#f6f6f6', 'সাদা জেলের মতো Al(OH)₃'], FeOH2: ['#9dc7a0', 'সবুজ Fe(OH)₂'], FeOH3: ['#b5651d', 'লালচে-বাদামি Fe(OH)₃'], ZnOH2: ['#f3f3f0', 'সাদা Zn(OH)₂'], CaSO4: ['#f6f6f2', 'সাদা CaSO₄'] };

