import { OpenAIApi, Configuration } from 'openai';
import path from 'path';
import { HierarchicalNSW } from 'hnswlib-node';

const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(config);

const numDimensions = 1536; // the length of data point vector that will be indexed.
const maxElements = 3; // the maximum number of data points.

const sentences = ['hello world', 'who are you', "i don't want it"];

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

  const sentence = 'who is this';

  // querying data point.
  const query = await openai.createEmbedding({
    model: 'text-embedding-ada-002',
    input: sentence,
  });

  // searching k-nearest neighbor data points.
  const numNeighbors = 1;
  const result = index.searchKnn(query.data.data[0].embedding, numNeighbors);

  console.table(result);
}

seed();
