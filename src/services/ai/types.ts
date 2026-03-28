export interface Translator {
  translateText(segments: string[], targetLanguage: string): Promise<string[]>;
}
