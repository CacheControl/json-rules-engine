export default function debug (message) {
  if ((typeof process !== 'undefined' && process.env && process.env.DEBUG && process.env.DEBUG.match(/json-rules-engine/)) ||
      (typeof window !== 'undefined' && window.DEBUG && window.DEBUG.match(/json-rules-engine/))) {
    console.log(message)
  }
}
