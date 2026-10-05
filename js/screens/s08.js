// Page 8: where to go next.
import hub from '../sections/hub.js';

export const meta = { title: 'Where next', terminal: true };

export default async function run(ctx) {
  await hub(ctx);
}
