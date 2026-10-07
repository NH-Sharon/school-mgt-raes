// Static SVG art for lab equipment (strings so they can be reused on the shelf, in the tool tray and in flying "actors").
// All colours come from the internal chemistry data, never user input.
import { Dispense, Tool } from './chem-bench-engine';

const GLASS = 'rgba(190,225,240,0.28)';
const EDGE = 'rgba(210,235,248,0.9)';

export function bottleSvg(color: string, label: string, sub: string, kind: Dispense): string {
  const body = kind === 'metal'
    ? `<rect x="6" y="30" width="48" height="52" rx="8" fill="${GLASS}" stroke="${EDGE}" stroke-width="2"/>
       <rect x="14" y="62" width="10" height="16" rx="2" fill="${color}"/><rect x="28" y="58" width="12" height="20" rx="2" fill="${color}" opacity=".85"/><rect x="42" y="66" width="8" height="12" rx="2" fill="${color}"/>
       <rect x="10" y="20" width="40" height="12" rx="3" fill="#6b4a2b"/>`
    : kind === 'powder'
    ? `<rect x="6" y="30" width="48" height="52" rx="8" fill="${GLASS}" stroke="${EDGE}" stroke-width="2"/>
       <path d="M8 82 V62 Q30 52 52 62 V82 Z" fill="#f4f1ea"/>
       <rect x="10" y="20" width="40" height="12" rx="3" fill="#cfd6db"/>`
    : kind === 'indicator'
    ? `<path d="M14 40 Q14 30 22 28 V18 H38 V28 Q46 30 46 40 V80 Q46 86 40 86 H20 Q14 86 14 80 Z" fill="${GLASS}" stroke="${EDGE}" stroke-width="2"/>
       <path d="M16 56 H44 V80 Q44 84 40 84 H20 Q16 84 16 80 Z" fill="${color}" opacity=".9"/>
       <rect x="23" y="6" width="14" height="14" rx="3" fill="#2d2d33"/><rect x="26" y="0" width="8" height="8" rx="4" fill="#2d2d33"/>`
    : `<path d="M20 12 H40 V26 Q54 30 54 44 V80 Q54 86 48 86 H12 Q6 86 6 80 V44 Q6 30 20 26 Z" fill="${GLASS}" stroke="${EDGE}" stroke-width="2"/>
       <path d="M8 52 H52 V80 Q52 84 48 84 H12 Q8 84 8 80 Z" fill="${color}" opacity=".92"/>
       <rect x="18" y="4" width="24" height="10" rx="3" fill="#2d2d33"/>`;
  const labelY = kind === 'indicator' ? 52 : 50;
  return `<svg viewBox="0 0 60 118" xmlns="http://www.w3.org/2000/svg">${body}
    <rect x="10" y="${labelY - 8}" width="40" height="26" rx="3" fill="#fffdf6" stroke="#b9ae91" stroke-width=".8"/>
    <text x="30" y="${labelY + 3}" text-anchor="middle" font-size="9" font-weight="700" fill="#233" font-family="sans-serif">${label}</text>
    <text x="30" y="${labelY + 13}" text-anchor="middle" font-size="5.5" fill="#556" font-family="sans-serif">${sub}</text></svg>`;
}

export function toolSvg(tool: Tool | 'bottle', fill = '#cfe8f5'): string {
  switch (tool) {
    case 'bottle':
    case 'pour':
      return `<svg viewBox="0 0 60 90" xmlns="http://www.w3.org/2000/svg"><path d="M20 8 H40 V22 Q54 26 54 40 V76 Q54 82 48 82 H12 Q6 82 6 76 V40 Q6 26 20 22 Z" fill="${GLASS}" stroke="${EDGE}" stroke-width="2"/><path d="M8 48 H52 V76 Q52 80 48 80 H12 Q8 80 8 76 Z" fill="${fill}" opacity=".92"/><rect x="18" y="2" width="24" height="9" rx="3" fill="#2d2d33"/></svg>`;
    case 'dropper':
      return `<svg viewBox="0 0 30 110" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="0" width="14" height="30" rx="7" fill="#c0392b"/><rect x="6" y="28" width="18" height="8" rx="2" fill="#7f8c8d"/><path d="M10 36 H20 V86 L15 104 L10 86 Z" fill="${GLASS}" stroke="${EDGE}" stroke-width="1.6"/><path d="M11.5 62 H18.5 V86 L15 100 L11.5 86 Z" fill="${fill}" opacity=".95"/></svg>`;
    case 'spoon':
      return `<svg viewBox="0 0 34 120" xmlns="http://www.w3.org/2000/svg"><rect x="14" y="0" width="6" height="86" rx="3" fill="#b8c2c9" stroke="#8d9aa3" stroke-width="1"/><ellipse cx="17" cy="100" rx="13" ry="16" fill="#cfd8dd" stroke="#8d9aa3" stroke-width="1.4"/><ellipse cx="17" cy="100" rx="9" ry="12" fill="${fill}" opacity=".85"/></svg>`;
    case 'forceps':
      return `<svg viewBox="0 0 40 120" xmlns="http://www.w3.org/2000/svg"><path d="M12 0 L18 100 L20 118" stroke="#8d9aa3" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M28 0 L22 100 L20 118" stroke="#a7b1b8" stroke-width="5" fill="none" stroke-linecap="round"/><rect x="15" y="104" width="10" height="9" rx="2" fill="${fill}"/></svg>`;
    case 'transfer':
      return `<svg viewBox="0 0 80 70" xmlns="http://www.w3.org/2000/svg"><path d="M8 6 V48 A12 12 0 0 0 32 48 V6" fill="${GLASS}" stroke="${EDGE}" stroke-width="2"/><path d="M10 28 H30 V48 A10 10 0 0 1 10 48 Z" fill="${fill}" opacity=".9"/><path d="M42 36 H66 M58 26 L68 36 L58 46" stroke="#37c2b5" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    case 'funnel':
      return `<svg viewBox="0 0 80 90" xmlns="http://www.w3.org/2000/svg"><path d="M6 8 H74 L46 52 V86 H34 V52 Z" fill="${GLASS}" stroke="${EDGE}" stroke-width="2.4"/><path d="M16 14 L40 50 L64 14" fill="#fffdf6" stroke="#b9ae91" stroke-width="1.4" stroke-dasharray="3 2"/></svg>`;
    case 'burner':
      return `<svg viewBox="0 0 60 100" xmlns="http://www.w3.org/2000/svg"><path d="M30 6 Q42 26 30 40 Q18 26 30 6Z" fill="#4aa3ff"/><path d="M30 14 Q37 28 30 38 Q23 28 30 14Z" fill="#ffd34d"/><rect x="25" y="42" width="10" height="34" rx="2" fill="#8d9aa3" stroke="#6b7780"/><rect x="10" y="76" width="40" height="14" rx="5" fill="#4a5560" stroke="#333"/><rect x="36" y="56" width="14" height="7" rx="2" fill="#c0392b"/></svg>`;
    case 'stir':
      return `<svg viewBox="0 0 24 120" xmlns="http://www.w3.org/2000/svg"><rect x="9" y="0" width="6" height="110" rx="3" fill="${GLASS}" stroke="${EDGE}" stroke-width="1.6"/><circle cx="12" cy="112" r="6" fill="${GLASS}" stroke="${EDGE}" stroke-width="1.6"/></svg>`;
    case 'wash':
      return `<svg viewBox="0 0 70 80" xmlns="http://www.w3.org/2000/svg"><path d="M12 18 H58 L52 70 Q51 76 45 76 H25 Q19 76 18 70 Z" fill="#3b4a56" stroke="#2a343d" stroke-width="2"/><path d="M10 18 H60" stroke="#6b7780" stroke-width="5" stroke-linecap="round"/><path d="M24 34 V58 M35 34 V58 M46 34 V58" stroke="#6b7780" stroke-width="3" stroke-linecap="round"/></svg>`;
  }
}

export const FLAME_SVG = `<svg viewBox="0 0 60 100" xmlns="http://www.w3.org/2000/svg" class="flame-art"><path d="M30 4 Q46 28 30 46 Q14 28 30 4Z" fill="#4aa3ff" opacity=".9"/><path d="M30 14 Q40 30 30 44 Q20 30 30 14Z" fill="#ffd34d"/><rect x="25" y="46" width="10" height="26" rx="2" fill="#8d9aa3" stroke="#6b7780"/><rect x="8" y="72" width="44" height="14" rx="5" fill="#4a5560" stroke="#333"/></svg>`;
