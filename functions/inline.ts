import { Context } from 'telegraf';

export default async (ctx: Context) => {
  // ctx.inlineMessageId
  const search = (ctx.inlineQuery.query || "");
  if (search === "" || isNaN(Number(search))) {
    return;
  }
  const number = Number(search);
  await ctx.editMessageText('gsom!');
  const answer = [];
  const tocamos = [2, 3, 4, 5, 6, 7, 8, 9, 10];
  tocamos.forEach((count: number) => {
    answer.push({
      id: count,
      title: count + " (" + search + " entre " + count + ")",
      type: 'article',
      input_message_content: {
        message_text: "Tocais cada uno a " + (Math.round(number / count) * 100) / 100 + " (" + search + " entre " + count + ")",
        parse_mode: 'HTML'
      }
    });
  });
  return ctx.answerInlineQuery(answer);
};
