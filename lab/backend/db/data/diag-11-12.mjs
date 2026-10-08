import fs from 'node:fs';
import { EXISTING, NEW } from './chem-dict.mjs';
import { keyOf, splitEquations, parseEq } from './chem-helpers.mjs';
const miss = {};
for (const b of ['chemistry-11', 'chemistry-12']) {
  const dir = `${b}/reactions`;
  for (const f of fs.readdirSync(dir)) {
    let d; try { d = JSON.parse(fs.readFileSync(`${dir}/${f}`, 'utf8')); } catch { continue; }
    for (const it of d.items) {
      if (it.type !== 'bench') continue;
      const eqs = splitEquations(typeof it.equation === 'string' ? it.equation : '').map(parseEq).filter(Boolean);
      for (const q of eqs) {
        if (!q.balanced || q.L.length !== 2) continue;
        for (const t of q.L) { const k = keyOf(t.f); if (!EXISTING[k] && !NEW[k]) miss[k + ' | ' + t.f] = (miss[k + ' | ' + t.f] || 0) + 1; }
      }
    }
  }
}
console.log(Object.entries(miss).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} x${v}`).join('\n'));
