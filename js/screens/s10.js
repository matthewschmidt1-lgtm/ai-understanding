// Page 10: an optional chapter, how AI reasons.
import reasoning from '../sections/reasoning.js';

export const meta = { title: 'How AI reasons', terminal: true };

export default async function run(ctx) {
  await reasoning(ctx);
}
