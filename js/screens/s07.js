// Page 7: the final reveal and the visitor's own sentence.
import reveal from '../sections/reveal.js';

export const meta = { title: 'The final reveal' };

export default async function run(ctx) {
  await reveal(ctx);
}
