import path from 'path';
import { HierarchicalNSW } from 'hnswlib-node';

const numDimensions = 1024; // the length of data point vector that will be indexed.
const maxElements = 100; // the maximum number of data points.

async function seed() {
  // declaring and intializing index.
  const index = new HierarchicalNSW('cosine', numDimensions);
  index.initIndex(maxElements);

  // inserting data points to index.
  for (let i = 0; i < maxElements; i++) {
    const point = new Array(numDimensions);
    for (let j = 0; j < numDimensions; j++) point[j] = Math.random();
    index.addPoint(point, i);
  }

  // saving index.
  // index.writeIndexSync(path.resolve(__dirname, '..', 'data', 'index.bin'));

  const query = new Array(numDimensions);
  for (let j = 0; j < numDimensions; j++) query[j] = Math.random();
  // searching k-nearest neighbor data points.
  const numNeighbors = 3;
  const result = index.searchKnn(query, numNeighbors);

  console.table(result);
}

seed();
