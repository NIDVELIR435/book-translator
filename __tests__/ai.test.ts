import { createOpenAITranslator } from '../src/services/ai/openai';
import { createAnthropicTranslator } from '../src/services/ai/anthropic';
import { getTranslator } from '../src/services/ai';

describe('getTranslator', () => {
  it('throws when provider is openai and OPENAI_API_KEY is missing', () => {
    const prevProvider = process.env.TRANSLATION_PROVIDER;
    const prevKey = process.env.OPENAI_API_KEY;
    process.env.TRANSLATION_PROVIDER = 'openai';
    process.env.OPENAI_API_KEY = '';
    expect(() => getTranslator()).toThrow('OPENAI_API_KEY');
    process.env.TRANSLATION_PROVIDER = prevProvider;
    process.env.OPENAI_API_KEY = prevKey;
  });
});

describe('openai translator', () => {
  it('returns empty array for empty segments', async () => {
    const t = createOpenAITranslator('sk-fake');
    const out = await t.translateText([], 'es');
    expect(out).toEqual([]);
  });
});

describe('anthropic translator', () => {
  it('returns empty array for empty segments', async () => {
    const t = createAnthropicTranslator('sk-fake');
    const out = await t.translateText([], 'es');
    expect(out).toEqual([]);
  });
});
