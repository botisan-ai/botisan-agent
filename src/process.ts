// import { OpenAIApi, Configuration } from 'openai';
import path from 'path';
import fs from 'fs/promises';
import { glob } from 'glob';
import { Conversation, PrismaClient } from '@prisma/client';
import { HierarchicalNSW } from 'hnswlib-node';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:../data/dev.sqlite3',
    },
  },
});

const numDimensions = 1536; // the length of data point vector that will be indexed.
const maxElements = 10000; // the maximum number of data points.

// const config = new Configuration({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// const openai = new OpenAIApi(config);

async function processConvo() {
  // declaring and intializing index.
  const index = new HierarchicalNSW('cosine', numDimensions);
  index.initIndex(maxElements);

  const files = await glob(
    path.resolve(__dirname, '..', 'convos', 'dnc', '*-data.json'),
  );

  const comment =
    'This is a DNC scenario (stands for "Do Not Contact". We politely respond that we will take the person off the list and will not contact him/her again.';

  for (const file of files) {
    // console.log(file);
    const dataString = await fs.readFile(file, 'utf-8');
    const data = JSON.parse(dataString);

    if (
      data.messagesHistory.length !== 3 ||
      data.messagesHistory.length !== data.events.length
    ) {
      console.log(file);
      continue;
    }

    // const msg = (data.messagesHistory as any[]).filter(
    //   (message) => !!message.embedding,
    // );

    // console.log(msg);

    const conversation = await prisma.conversation.create({
      data: {
        label: 'DNC',
      },
    });

    // console.log(conversation);

    // const items = [];

    for (let i = 0; i < data.events.length; i++) {
      const event = data.events[i];
      const messageHistoryItem = data.messagesHistory[i];
      if (event.type === 'xstate.init') {
        // sms campaign message
        const message = {
          role: 'assistant',
          content: `SMS Campaign:\n\`\`\`\n${messageHistoryItem.content}\n\`\`\``,
        };

        const item = await prisma.conversationItem.create({
          data: {
            ...message,
            conversations: {
              connect: conversation,
            },
          },
        });

        // console.log(item);

        continue;
      }

      if (event.type === 'INBOUND_MESSAGE') {
        // user message
        const message = {
          role: 'user',
          content: messageHistoryItem.content,
        };

        const item = await prisma.conversationItem.create({
          data: {
            ...message,
            conversations: {
              connect: conversation,
            },
          },
        });

        index.addPoint(messageHistoryItem.embedding, conversation.id);

        continue;
      }

      if (event.type === 'DNC') {
        // dnc response
        const message = {
          role: 'assistant',
          content: `Response:\n\`\`\`\n${messageHistoryItem.content}\n\`\`\``,
        };

        const item = await prisma.conversationItem.create({
          data: {
            ...message,
            conversations: {
              connect: conversation,
            },
          },
        });

        continue;
      }
    }

    // saving index.
    index.writeIndexSync(path.resolve(__dirname, '..', 'data', 'index.bin'));

    // break;

    // const { events } = data;

    // // if any one of the event object has a type of "DNC", we move the file to the "dnc" folder
    // const dnc = events.some((event) => event.type === 'GENERAL_INQUIRY');
    // if (dnc) {
    //   await fs.rename(file, file.replace('convos', 'convos/inquiry'));
    //   await fs.rename(
    //     file.replace('-data.json', '.json'),
    //     file.replace('-data.json', '.json').replace('convos', 'convos/inquiry'),
    //   );
    //   continue;
    // }

    //   const { messagesHistory } = data;

    //   for (const message of messagesHistory) {
    //     if (message.role === 'user') {
    //       console.log(message.content);

    //       const embeddingResponse = await openai.createEmbedding({
    //         model: 'text-embedding-ada-002',
    //         input: message.content,
    //       });

    //       message.embedding = embeddingResponse.data.data[0].embedding;
    //     }
    //   }

    //   await fs.writeFile(file, JSON.stringify(data, null, 2));
  }

  console.log(files.length);
}

processConvo();
