// Screen 10, the experiment. A question with no graded answer: every choice gets the same reply.
export const meta = { title: 'What do you think?' };

export default async function run(ctx) {
  await ctx.say('What do you think?', { cls: 'hero-word', hold: 1400 });
  const { value } = await ctx.choose(
    [
      { value: 'yes', label: 'YES', sub: 'AI understands.' },
      { value: 'no', label: 'NO', sub: 'AI doesn’t understand.' },
      { value: 'unsure', label: 'I’M NOT SURE', sub: 'We don’t know what “understand” means well enough.' },
    ],
    { label: 'Does AI understand?', cls: 'verdict' },
  );
  ctx.state.set('verdict', value);
  await ctx.clear();
  await ctx.say('Reasonable.', { cls: 'big', hold: 1600 });
  const mirror = {
    yes: 'Then the question becomes what, exactly, the model has that deserves the word.',
    no: 'Then the question becomes what, exactly, is missing.',
    unsure: 'That is an honest place to stand.',
  };
  await ctx.say(mirror[value], { cls: 'quiet', hold: 2200 });
  await ctx.say('Here’s the uncomfortable part:', { cls: 'quiet', hold: 1200 });
  await ctx.say('The behavior alone doesn’t tell us what’s happening inside.', { cls: 'mid', hold: 3200 });
  await ctx.say('We can inspect the computation. We can study the representations. We can test what the model can generalize.', { cls: 'mid', hold: 3600 });
  await ctx.say('But whether those things amount to “understanding” depends partly on what we mean by understanding.', { cls: 'mid', hold: 800 });
  await ctx.button('Next');
}
