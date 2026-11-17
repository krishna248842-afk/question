import { createChapterPack } from '../packHelper.js';
import { pack1 } from './c11-01/pack1.js';
import { pack2 } from './c11-01/pack2.js';
import { pack3 } from './c11-01/pack3.js';
import { pack4 } from './c11-01/pack4.js';
import { pack5 } from './c11-01/pack5.js';
import { pack6 } from './c11-01/pack6.js';
import { pack7 } from './c11-01/pack7.js';
import { pack8 } from './c11-01/pack8.js';

export const questions = createChapterPack('c11-01', [
  ...pack1,
  ...pack2,
  ...pack3,
  ...pack4,
  ...pack5,
  ...pack6,
  ...pack7,
  ...pack8,
]);
