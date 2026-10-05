// Page 3: context changes a word, and attention is how the information moves.
import context from '../sections/context.js';
import attention from '../sections/attention.js';

export const meta = { title: 'Context and attention' };

export default async function run(ctx) {
  await context(ctx);
  await ctx.clear();
  await attention(ctx);
}
