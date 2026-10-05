// Page 2: numbers become a map of relationships.
import latent from '../sections/latent.js';

export const meta = { title: 'A tiny latent space' };

export default async function run(ctx) {
  await latent(ctx);
}
