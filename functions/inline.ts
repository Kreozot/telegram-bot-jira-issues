import { Context } from 'telegraf';
import JiraApi from 'jira-client';
import dotenv from 'dotenv';

dotenv.config();

const askJira = async () => {
  const jira = new JiraApi({
    protocol: 'https',
    host: 'l2u.atlassian.net',
    username: process.env.JIRA_USERNAME,
    password: process.env.JIRA_API_TOKEN,
    apiVersion: '2',
    strictSSL: true
  });

  const issue = await jira.findIssue('DES-30');
  console.log(issue);
}

// askJira();

export default async (ctx: Context) => {
  const search = (ctx.inlineQuery && ctx.inlineQuery.query || "");
  if (search === "") {
    return;
  }
  const number = Number(search);
  const answer = [{
    id: '0',
    title: 'Ну давай, попробуй!',
    type: 'article',
    input_message_content: {
      message_text: search.replace(/пыщь/gm, '[попячсо](http://upyachka.ru)'),
      parse_mode: 'MarkdownV2'
    }
  }];
  return ctx.answerInlineQuery(answer as any);
};
