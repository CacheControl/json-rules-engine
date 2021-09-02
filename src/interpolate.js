export const defaultInterpolation = /\{\{\s*(.+?)\s*\}\}/g

export const needsInterpolation = (rule,regexp) => regexp.test(rule.toJSON(true));

const interpolate = (subject = '', params = {}, regexp, resolver) => {
  let shouldReplaceFull, found;

  const replaced = subject.replace(regexp, (full, matched) => {
    shouldReplaceFull = full === subject;
    found = resolver(params, matched);
    return shouldReplaceFull ? '' : found;
  });

  return shouldReplaceFull ? found : replaced;
};


export const interpolateDeep = (o, params, regexp, resolver) => {
  if (!o || typeof o === 'number' || typeof o === 'boolean') return o;

  if (typeof o === 'string') return interpolate(o,params,regexp,resolver)

  if (Array.isArray(o)) return o.map(t => interpolateDeep(t, params, regexp, resolver));

  return Object.entries(o).reduce((acc, [k, v]) => ({...acc,[k]: interpolateDeep(v, params, regexp, resolver)}),{});
};

