function createDebug() {
  try {
    if (
      (typeof process !== "undefined" &&
        process.env &&
        process.env.DEBUG &&
        process.env.DEBUG.match(/json-rules-engine/)) ||
      (typeof window !== "undefined" &&
        window.localStorage &&
        window.localStorage.debug &&
        window.localStorage.debug.match(/json-rules-engine/))
    ) {
      return console.debug.bind(console);
    }
  } catch (ex) {
    // Do nothing
  }
  return () => {};
}

export default createDebug();
