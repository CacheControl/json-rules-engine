import { JSONPath } from 'jsonpath-plus'

export function defaultPathResolver (value, path) {
    return JSONPath({ path, json: value, wrap: false })
}