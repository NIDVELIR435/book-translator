const provider = process.env.TRANSLATION_PROVIDER || 'openai';
const openaiKey = process.env.OPENAI_API_KEY;
const anthropicKey = process.env.ANTHROPIC_API_KEY;

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  translationProvider: provider as 'openai' | 'anthropic',
  openaiApiKey: openaiKey || '',
  anthropicApiKey: anthropicKey || '',
};
