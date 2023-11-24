export const filterInvalidText = str => {
  const result = str.match(/\w+=[-\w]+/g);
  return result?.join(';') || '';
};