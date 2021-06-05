import { Handler, APIGatewayEvent } from 'aws-lambda';
import { Telegraf, Context } from 'telegraf';
import dotenv from 'dotenv';

import startAction from './start';
import inlineAction from './inline';

dotenv.config();
const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx: Context) => {
  return startAction(ctx);
})

bot.on('inline_query', (ctx: Context) => {
  return inlineAction(ctx);
})

export const handler: Handler = async (event: APIGatewayEvent) => {
  await bot.handleUpdate(JSON.parse(event.body));
  return { statusCode: 200, body: '' };
};
