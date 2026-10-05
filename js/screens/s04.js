// Page 4: open the black box and run words through it.
import blackbox from '../sections/blackbox.js';

export const meta = { title: 'Inside the black box' };

export default async function run(ctx) {
  await blackbox(ctx);
}
