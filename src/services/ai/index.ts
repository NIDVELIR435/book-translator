import { config } from '../../config';
import { createAnthropicTranslator } from './anthropic';
import { createOpenAITranslator } from './openai';
import type { Translator } from './types';

export type { Translator } from './types';

export function getTranslator(): Translator {
  const provider = process.env.TRANSLATION_PROVIDER || config.translationProvider;
  const openaiApiKey = process.env.OPENAI_API_KEY ?? config.openaiApiKey;
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY ?? config.anthropicApiKey;
  if (provider === 'openai') {
    if (!openaiApiKey) throw new Error('TRANSLATION_PROVIDER=openai requires OPENAI_API_KEY');
    return createOpenAITranslator(openaiApiKey);
  }
  if (provider === 'anthropic') {
    if (!anthropicApiKey) throw new Error('TRANSLATION_PROVIDER=anthropic requires ANTHROPIC_API_KEY');
    return createAnthropicTranslator(anthropicApiKey);
  }
  throw new Error(`Unknown TRANSLATION_PROVIDER: ${provider}`);
}
