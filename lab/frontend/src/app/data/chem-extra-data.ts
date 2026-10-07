// Extra chemicals/materials for the Class 9-10 curriculum labs (filled from the textbook extraction).
// NOTE: type-only import to avoid a runtime cycle with chemistry-lab-data.ts.
import type { Chemical } from './chemistry-lab-data';

import { GEN_CHEMICALS } from './chem-curriculum-9-10.generated';

export const EXTRA_CHEMICALS: Chemical[] = GEN_CHEMICALS;
