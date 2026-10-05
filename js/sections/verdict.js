// Section: the experiment. A question with no graded answer: every choice gets the same reply.
export default async function run(ctx) {
  await ctx.say('What do you think?', { cls: 'hero-word', hold: 700 });
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
  await ctx.say('Reasonable.', { cls: 'big', hold: 900 });
  const mirror = {
    yes: 'Then the question becomes what, exactly, the model has that deserves the word.',
    no: 'Then the question becomes what, exactly, is missing.',
    unsure: 'That is an honest place to stand.',
  };
  await ctx.say(mirror[value], { cls: 'quiet', hold: 1400 });
  await ctx.say('Here’s the uncomfortable part: the behavior alone doesn’t tell us what’s happening inside, even though we can inspect the computation, study the representations and test what the model can generalize.', { cls: 'mid', hold: 4600 });
  await ctx.say('But whether those things amount to “understanding” depends partly on what we mean by understanding.', { cls: 'mid', hold: 1200 });
  await ctx.button('Next');
}
