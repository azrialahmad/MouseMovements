/**
 * Algorithm registry — add/remove algorithms here.
 * Each module must export: a generator function + a `meta` object.
 *
 * meta shape:
 *   id        string   key used in COLORS, canvases, stats DOM ids
 *   name      string   display name
 *   tag       string   badge label
 *   tagClass  string   CSS class for badge color
 *   color     string   CSS var e.g. 'var(--linear)'
 *   desc      string   description text
 *   creditHtml string  innerHTML for credit line (may contain <a> tags)
 */

import { genLinear,      meta as linearMeta  } from './linear.js';
import { genCubicBezier, meta as bezierMeta  } from './cubicbezier.js';
import { genWindMouse,   meta as windMeta    } from './windmouse.js';
import { genSigmaDrift,  meta as sigmaMeta   } from './sigmadrift.js';

export const ALGOS = [
  { ...linearMeta,  gen: genLinear },
  { ...bezierMeta,  gen: genCubicBezier },
  { ...windMeta,    gen: genWindMouse },
  { ...sigmaMeta,   gen: genSigmaDrift },
];
