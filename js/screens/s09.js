// Page 9: an optional chapter, how AI learns.
import learning from '../sections/learning.js';

export const meta = { title: 'How AI learns', terminal: true };

export default async function run(ctx) {
  await learning(ctx);
}
