import { Context } from 'telegraf';
import inlineAction from '../functions/inline';

inlineAction({
  inlineQuery: {
    id: '123',
    query: '@jira_issues_bot Работает типа того: Начинаю с mention `@jira_issues_bot` и в сообщении использую идентификаторы тасок (например DES-30 или INTRA-226) и после клика на "Обогатить информацией из Jira" бот заменяет их на ссылки с названиями тасок.',
    offset: '',
    from: {
      username: 'testuser',
      id: 12345,
      is_bot: false,
      first_name: "Test",
    }
  },
  answerInlineQuery: (answer: any) => {
    console.log(answer);
  }
} as Context);
