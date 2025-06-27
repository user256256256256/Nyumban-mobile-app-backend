export const isEmail = (identifier) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
export default isEmail;