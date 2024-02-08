export function jsonStringifyWithBigInt (data) {
    return JSON.stringify(data,
      (key, value) => {
        return typeof value === "bigint" ? value.toString() : value;
      }
    )
}
