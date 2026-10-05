// Page 1: a dog, then the numbers behind the word. Two sections, one page.
import dog from '../sections/dog.js';
import numbers from '../sections/numbers.js';

export const meta = { title: 'A dog, then numbers' };

export default async function run(ctx) {
  await dog(ctx);
  await ctx.clear();
  await numbers(ctx);
}
