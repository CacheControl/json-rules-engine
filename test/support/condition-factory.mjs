export default function (options) {
  return {
    fact: options.fact || null,
    value: options.value || null,
    operator: options.operator || "equal",
  };
}
