import { OpenAIApi, Configuration } from 'openai';
import path from 'path';
import fs from 'fs/promises';
import { glob } from 'glob';

const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(config);

async function processConvo() {
  const embeddingResponse = await openai.createEmbedding({
    model: 'text-embedding-ada-002',
    input: 'Camille: Hi\nSimon: Hello!',
  });

  console.log(embeddingResponse);
}

processConvo();
