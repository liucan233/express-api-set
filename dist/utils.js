export const headersToString = h => {
  let rec = {};
  for (const [k, v] of h.entries()) {
    rec[k] = v;
  }
  return JSON.stringify(rec);
};