import { JSONPath } from "jsonpath-plus";
import FactDecorator from "./fact-decorator";

export const PathDecorator = new FactDecorator("path", (params, almanac, next) => {
    if (Object.prototype.hasOwnProperty.call(params, 'path')) {
        const path = params.path
        const paramCopy = Object.assign({}, params)
        delete paramCopy.path
        return Promise.resolve(next(paramCopy, almanac)).then(factValue => {
          if (factValue != null && typeof factValue === 'object') {
            const pathValue = JSONPath({ json: factValue, path, wrap: false })
            debug('condition::evaluate extracting object', { property: path, received: pathValue })
            return pathValue
          } else {
            debug('condition::evaluate could not compute object path of non-object', { path, factValue, type: typeof factValue })
            return factValue
          }
        })

    } else {
        return next(params, almanac);
    }
})

export const KeysOfDecorator = new FactDecorator("keysOf", (params, almanac, next) => {
    const n = next(params, almanac)
    if (n != null) {
        if (Object.prototype.hasOwnProperty.call(n, 'keys') && typeof n.keys === 'function') {
            return Array.from(n.keys())
        }
        return Object.keys(n)
    }
    return n;
})

export const ValuesOfDecorator = new FactDecorator("valuesOf", (params, almanac, next) => {
    const n = next(params,almanac)
    if (n != null) {
        if (Object.prototype.hasOwnProperty(n, 'values') && typeof n.values === 'function') {
            return Array.from(n.values())
        }
        return Object.values(n)
    }
    return n
})

export const SizeOfDecorator = new FactDecorator("sizeOf", (params, almanac, next) => {
    const n = next(params, almanac)
    if (n != null) {
        if (Object.prototype.hasOwnProperty(n, 'length')) {
            return n.length
        } else if (Object.prototype.hasOwnProperty(n, 'size') && typeof n.size === 'function') {
            return n.size()
        }
    }
    return 1
})

/**
 * Options (arg 3) are merged onto fact options and override
 * This allows us to do things like create a noCache version of a fact
 * noCache:name for instance would access the name fact without hitting the cache
 */
export const NoCacheDecorator = new FactDecorator("noCache", (params, almanac, next) => next(params, almanac), { cache: false })