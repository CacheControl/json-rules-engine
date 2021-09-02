export const defaultInterpolation = /\{\{\s*(.+?)\s*\}\}/g

export const needsInterpolation = (rule,regexp) => regexp.test(rule.toJSON(true));

export const interpolateDeep = (o, params, regexp, resolver) => {
  if (!o || typeof o === 'number' || typeof o === 'boolean') return o;

  if (typeof o === 'string') return o.replace(regexp, (_, matched) => resolver(params,matched))

  if (Array.isArray(o)) return o.map(t => interpolateDeep(t, params, regexp, resolver));

  return Object.entries(o).reduce((acc, [k, v]) => ({...acc,[k]: interpolateDeep(v, params, regexp, resolver)}),{});
};