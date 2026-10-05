// Page 5: the model's answer is a probability distribution, one token at a time.
import nexttoken from '../sections/nexttoken.js';

export const meta = { title: 'Predict the next token' };

export default async function run(ctx) {
  await nexttoken(ctx);
}
