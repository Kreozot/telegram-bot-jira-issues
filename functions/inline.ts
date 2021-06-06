import { Context } from 'telegraf';
import JiraApi from 'jira-client';
import dotenv from 'dotenv';

dotenv.config();

const ISSUE_REGEXP = /[A-Z][A-Z0-9]+-[0-9]+/gm;

const checkEnvs = (envNames: string[]) => {
  envNames.forEach((envName) => {
    if (!process.env[envName]) {
      throw new Error(`Не найдена переменная окружения ${ envName }`);
    }
  })
}

checkEnvs(['JIRA_HOST', 'JIRA_USERNAME', 'JIRA_API_TOKEN', 'ALLOWED_USERS']);

const getJiraIssueUrl = (issueKey: string): string => {
  return `https://${ process.env.JIRA_HOST }/browse/${ issueKey }`;
}

const getJiraIssues = async (issueKeys: string[]) => {
  const jira = new JiraApi({
    protocol: 'https',
    host: String(process.env.JIRA_HOST),
    username: String(process.env.JIRA_USERNAME),
    password: String(process.env.JIRA_API_TOKEN),
    apiVersion: '2',
    strictSSL: true
  });

  return Promise.all(
    issueKeys.map(async (issueKey) => {
      try {
        const issue = await jira.findIssue(issueKey);
        return issue;
      } catch (err) {
        if (err.statusCode === 404) {
          console.warn(`Не найдена задача ${ issueKey }`);
        } else {
          console.error(err);
        }
        return null;
      }
    })
  );
};

const getJiraIssueKeys = (text: string) => {
  return [...text.matchAll(ISSUE_REGEXP)].map((match) => match[0]);
};

// Don't replace `-` before in order to not prevent issue keys parsing
const escapeMarkdownBefore = (text: string): string => {
  return text.replace(/([_~`.()])/gi, "\\$1");
}

const escapeMarkdownAfter = (text: string): string => {
  return text.replace(/([\-])/gi, "\\$1");
}

const getJiraIssuesMap = (jiraIssues: (JiraApi.JsonResponse | null)[]): Map<string, string> => {
  return jiraIssues
    .reduce<Map<string, string>>(
      (result, issue) => {
        if (issue) {
          const summary = escapeMarkdownBefore(issue.fields.summary);
          result.set(issue.key, `[*${ issue.key }* ${ summary }](${ getJiraIssueUrl(issue.key) })`);
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

const isUserAllowed = (id: number, username?: string): boolean => {
  const allowedUsers = String(process.env.ALLOWED_USERS).split(';');
  return allowedUsers.includes(String(id))
    || ((typeof username === 'string') && allowedUsers.includes(username));
}

export default async (ctx: Context) => {
  if (!ctx.inlineQuery) {
    return;
  }
  if (!isUserAllowed(ctx.inlineQuery.from.id, ctx.inlineQuery.from.username)) {
    console.warn('Заблокировано сообщение от неавторизованного пользователя', ctx.inlineQuery.from);
    return;
  }

  const text = (ctx.inlineQuery.query || "");
  const issueKeys = getJiraIssueKeys(text);
  if (issueKeys.length === 0) {
    return;
  }

  const jiraIssues = await getJiraIssues(issueKeys);
  const jiraIssuesMap = getJiraIssuesMap(jiraIssues);
  const newText = replaceJiraIssueKeys(escapeMarkdownBefore(text), jiraIssuesMap);

  const answer = [{
    id: '0',
    title: `Обогатить информацией из Jira (${ [...jiraIssuesMap.keys()].join(', ') })`,
    type: 'article',
    input_message_content: {
      message_text: escapeMarkdownAfter(newText),
      parse_mode: 'MarkdownV2'
    },
  }];
  return ctx.answerInlineQuery(answer as any);
};
