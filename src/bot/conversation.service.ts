import { Injectable, Logger } from '@nestjs/common';
import path from 'path';
import { HierarchicalNSW } from 'hnswlib-node';

import { Conversation, PrismaService } from '@src/modules/prisma';

// the length of data point vector that will be indexed.
export const NUM_DIMENSIONS = 1536;

// the maximum number of data points.
export const MAX_ELEMENTS = 3;

export const THRESHOLD = 0.2;

@Injectable()
export class ConversationService {
  private logger = new Logger(ConversationService.name);
  private index: HierarchicalNSW;

  constructor(private readonly prisma: PrismaService) {
    this.index = new HierarchicalNSW('cosine', NUM_DIMENSIONS);
    this.index.readIndexSync(path.resolve(process.cwd(), 'data', 'index.bin'));
  }

  async searchSimilarConversations(query: number[]): Promise<any[]> {
    // search similar conversations based on the input embedding
    const result = this.index.searchKnn(query, MAX_ELEMENTS);
    this.logger.verbose(`search result: ${JSON.stringify(result)}`);

    // get the conversation ids from the search result
    const { neighbors, distances } = result;

    // filter out the neighbors that are not similar enough
    const similarNeighbors = neighbors.filter(
      (neighbor, index) => distances[index] < THRESHOLD,
    );

    this.logger.verbose(
      `similar neighbors: ${JSON.stringify(similarNeighbors)}`,
    );

    const conversations = await this.prisma.conversation.findMany({
      where: {
        id: {
          in: similarNeighbors,
        },
      },
      include: {
        items: true,
      },
    });

    return conversations;
  }
}
