import { Context } from 'telegraf';

export default (ctx: Context) => {
  const search = (ctx.inlineQuery.query || "")
  if (search === "" || isNaN(Number(search))) {
    return
  } else {
    const number = Number(search);
    const answer = []
    const tocamos = [2, 3, 4, 5, 6, 7, 8, 9, 10]
    tocamos.forEach(function (tocamos) {
      answer.push({
        id: tocamos,
        title: tocamos + " (" + search + " entre " + tocamos + ")",
        type: 'article',
        input_message_content: {
          message_text: "Tocais cada uno a " + (Math.round(number / tocamos) * 100) / 100 + " (" + search + " entre " + tocamos + ")",
          parse_mode: 'HTML'
        }
      })
    })
    return ctx.answerInlineQuery(answer)
  }
}
