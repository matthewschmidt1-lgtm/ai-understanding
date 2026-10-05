// Page 6: the moment of doubt, then the question put to the visitor.
import doubt from '../sections/doubt.js';
import verdict from '../sections/verdict.js';

export const meta = { title: 'Doubt, and what do you think' };

export default async function run(ctx) {
  await doubt(ctx);
  await ctx.clear();
  ctx.theme('paper'); // the one dark beat ends here
  await verdict(ctx);
}
