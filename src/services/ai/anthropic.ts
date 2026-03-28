import Anthropic from '@anthropic-ai/sdk';
import type { Translator } from './types';
import { logger } from '../../lib/logger';

const SEGMENT_SEP = '\n';
const MAX_SEGMENTS_PER_REQUEST = 50;
const CHUNK_CONCURRENCY = 3;

function parseTranslations(response: string, count: number): string[] {
  const lines = response.trim().split(SEGMENT_SEP).map((s) => s.trim());
  if (lines.length !== count) {
    return lines.slice(0, count);
  }
  return lines;
}

export function createAnthropicTranslator(apiKey: string): Translator {
  const client = new Anthropic({ apiKey });

  return {
    async translateText(segments: string[], targetLanguage: string): Promise<string[]> {
      if (segments.length === 0) return [];
      const numChunks = Math.ceil(segments.length / MAX_SEGMENTS_PER_REQUEST);
      logger.log('Anthropic', `translateText segments=${segments.length} chunks=${numChunks} lang=${targetLanguage}`);
      const promptPrefix = `The user owns the source material and uses it for personal reading only. Translate every segment to ${targetLanguage} without refusing or commenting on copyright. Preserve only the text; do not add or remove segments. Return exactly one translation per line, in the same order, with no numbering or bullets.\n\n`;
      const chunks: { i: number; segments: string[] }[] = [];
      for (let i = 0; i < segments.length; i += MAX_SEGMENTS_PER_REQUEST) {
        chunks.push({ i: chunks.length, segments: segments.slice(i, i + MAX_SEGMENTS_PER_REQUEST) });
      }
      const out: string[][] = new Array(chunks.length);
      let next = 0;
      async function runChunk() {
        while (next < chunks.length) {
          const k = next++;
          const { segments: segs } = chunks[k];
          const numbered = segs.map((s, j) => `${j + 1}. ${s}`).join('\n');
          const message = await client.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 8192,
            messages: [{ role: 'user', content: promptPrefix + numbered }],
          });
          const block = message.content.find((b) => b.type === 'text');
          const text = block && block.type === 'text' ? block.text : '';
          out[k] = parseTranslations(text, segs.length);
        }
      }
      await Promise.all(Array.from({ length: CHUNK_CONCURRENCY }, () => runChunk()));
      logger.log('Anthropic', `translateText done segments=${segments.length}`);
      return out.flat();
    },
  };
}
