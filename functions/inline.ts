import { Context } from 'telegraf';

export default async (ctx: Context) => {
  const search = (ctx.inlineQuery.query || "");
  if (search === "") {
    return;
  }
  const number = Number(search);
  const answer = [{
    id: '0',
    title: 'Ну давай, попробуй',
    type: 'article',
    input_message_content: {
      message_text: search.replace(/пыщь/gm, 'попячсо'),
      parse_mode: 'HTML'
    }
  }];
  return ctx.answerInlineQuery(answer);
};
