import { OpenAIApi, Configuration } from 'openai';
import path from 'path';
import { HierarchicalNSW } from 'hnswlib-node';

const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(config);

const numDimensions = 1536; // the length of data point vector that will be indexed.
const maxElements = 3; // the maximum number of data points.

// const sentences = [
//   "Assistant: Hey Louis, This is Tom, I just tried to reach you about your injury consultation. When is a good time for us to chat? txt stop to optout\nHuman: That's all right I made a mistake",
//   "Assitant: Looks like I couldn't reach you today about the form you filled out. Lets chat about your injury consultation. What time is good for you? rply quit to opt out\nHuman: I wasn't injured",
//   "Assistant: Amy, if you still need help regarding your accident, we are here. Give me a good time to call you and I'll call you then. reply opt out to stop\nHuman: Tonight around 7pm",
// ];

const sentences = [
  "That's all right I made a mistake",
  "I wasn't injured",
  'Tonight around 7pm',
];

async function seed() {
  // declaring and intializing index.
  const index = new HierarchicalNSW('cosine', numDimensions);
  index.readIndexSync(path.resolve(__dirname, '..', 'data', 'index.bin'));

  // index.initIndex(maxElements);

  // // inserting data points to index.
  // for (let i = 0; i < maxElements; i++) {
  //   const response = await openai.createEmbedding({
  //     model: 'text-embedding-ada-002',
  //     input: sentences[i],
  //   });
  //   index.addPoint(response.data.data[0].embedding, i);
  // }

  // // saving index.
  // index.writeIndexSync(path.resolve(__dirname, '..', 'data', 'index.bin'));

  // const sentence =
  //   'Assistant: Hey Duc, This is Tom, I just tried to reach you about your injury consultation. When is a good time for us to chat? rply stop to opt-out\nHuman: Wrong person';
  // const sentence =
  //   'Assistant: Hey Emily, This is Tom, I just tried to reach you about your injury consultation. When is a good time for us to chat? txt stop to optout\nHuman: Wrong person please stop trying to contact me';

  const sentence = 'call me tomorrow afternoon';

  // querying data point.
  const query = await openai.createEmbedding({
    model: 'text-embedding-ada-002',
    input: sentence,
  });

  // searching k-nearest neighbor data points.
  const numNeighbors = 3;
  const result = index.searchKnn(query.data.data[0].embedding, numNeighbors);

  console.table(result);
}

seed();
