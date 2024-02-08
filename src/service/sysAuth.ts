import { jwtDecode, jwtSign } from '../libraries/jwt';
import { logger } from '../logger';

const a = jwtSign({ a: 1, b: 2 });

console.log(jwtDecode(a));
