export function mergeDeep(target: any, source: any) {
  if (typeof target !== "object" || target === null) {
    return source;
  }

  if (typeof source !== "object" || source === null) {
    return target;
  }

  const output = { ...target };

  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      const sourceValue = source[key];
      const targetValue = target[key];

      if (Array.isArray(sourceValue)) {
        output[key] = Array.isArray(targetValue)
          ? targetValue.concat(sourceValue)
          : sourceValue;
      } else if (typeof sourceValue === "object" && sourceValue !== null) {
        output[key] = mergeDeep(targetValue, sourceValue);
      } else {
        output[key] = sourceValue;
      }
    }
  }

  return output;
}
