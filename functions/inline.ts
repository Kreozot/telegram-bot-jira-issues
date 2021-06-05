import { Context } from 'telegraf';
import JiraApi from 'jira-client';
import dotenv from 'dotenv';

dotenv.config();

const ISSUE_REGEXP = /[A-Z]+-[0-9]+/gm;

const getJiraIssueUrl = (issueKey: string): string => {
  return `https://${ process.env.JIRA_HOST }/browse/${ issueKey }`;
}

const checkEnvs = (envNames: string[]) => {
  envNames.forEach((envName) => {
    if (!process.env[envName]) {
      throw new Error(`Не найдена переменная окружения ${ envName }`);
    }
  })
}

const getJiraIssues = async (issueKeys: string[]) => {
  checkEnvs(['JIRA_HOST', 'JIRA_USERNAME', 'JIRA_API_TOKEN']);

  const jira = new JiraApi({
    protocol: 'https',
    host: String(process.env.JIRA_HOST),
    username: String(process.env.JIRA_USERNAME),
    password: String(process.env.JIRA_API_TOKEN),
    apiVersion: '2',
    strictSSL: true
  });

  return Promise.all(issueKeys.map(async (key) => {
    try {
      const result = await jira.findIssue(key);
      return result;
    } catch (err) {
      if (err.statusCode === 404) {
        console.warn(`Не найдена задача ${ key }`);
      } else {
        console.error(err);
      }
      return null;
    }
  }));
};

const getJiraIssueKeys = (text: string) => {
  return [...text.matchAll(ISSUE_REGEXP)].map((match) => match[0]);
};

const getJiraIssuesMap = (jiraIssues: (JiraApi.JsonResponse | null)[]): Map<string, string> => {
  return jiraIssues
    .reduce<Map<string, string>>(
      (result, issue) => {
        if (issue) {
          result.set(issue.key, `[*${ issue.key }* ${ issue.fields.summary }](${ getJiraIssueUrl(issue.key) })`);
        }
        return result;
      },
      new Map<string, string>()
    );
};

const replaceJiraIssueKeys = (text: string, jiraIssuesMap: Map<string, string>): string => {
  return [...jiraIssuesMap.keys()]
    .reduce<string>(
      (result: string, issueKey: string) => {
        // Find only TEST-10 (not MYTEST-10 or TEST-101)
        const issueRegexp = new RegExp(`([^A-Z]|^)${ issueKey }([^0-9]|$)`);
        return result.replace(issueRegexp, `$1${ jiraIssuesMap.get(issueKey) }$2`);
      },
      text
    );
};

export default async (ctx: Context) => {
  const text = (ctx.inlineQuery && ctx.inlineQuery.query || "");
  const issueKeys = getJiraIssueKeys(text);
  if (issueKeys.length === 0) {
    return;
  }

  const jiraIssues = await getJiraIssues(issueKeys);
  const jiraIssuesMap = getJiraIssuesMap(jiraIssues);
  const newText = replaceJiraIssueKeys(text, jiraIssuesMap);

  const answer = [{
    id: '0',
    title: `Обогатить информацией из Jira (${ issueKeys.join(', ') })`,
    type: 'article',
    input_message_content: {
      message_text: newText,
      parse_mode: 'MarkdownV2'
    }
  }];
  return ctx.answerInlineQuery(answer as any);
};
