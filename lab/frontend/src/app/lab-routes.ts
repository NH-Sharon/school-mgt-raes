// Single source of truth mapping simulation keys <-> their /simulate/* routes.
export const KEY_TO_ROUTE: Record<string, string> = {
  'chem-mixing': '/simulate/chemistry',
  'chem-titration': '/simulate/titration',
  'phy-pendulum': '/simulate/physics',
  'bio-microscope': '/simulate/biology',
  'ict-logic-gates': '/simulate/ict',
  'phy-circuit': '/simulate/circuit',
  'phy-lens': '/simulate/lens',
  'bio-photosynthesis': '/simulate/photosynthesis',
  'ict-html-editor': '/simulate/html-editor',
};

// route last-segment -> key
export const SEGMENT_TO_KEY: Record<string, string> = Object.fromEntries(
  Object.entries(KEY_TO_ROUTE).map(([key, route]) => [route.split('/').pop() as string, key])
);
