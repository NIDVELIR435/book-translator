import { extractSegments, applyTranslations } from '../lib/html';
import type { Translator } from './ai/types';
import { loadEpubChapters, writeEpubFromZip } from './epub';
import { logger } from '../lib/logger';

const CHAPTER_CONCURRENCY = 1;

export async function translateChapters(
  chapters: { path: string; html: string }[],
  targetLanguage: string,
  translator: Translator
): Promise<{ path: string; html: string }[]> {
  const start = Date.now();
  logger.log('TranslateChapters', `start chapters=${chapters.length} targetLanguage=${targetLanguage}`);
  const results: { path: string; html: string }[] = new Array(chapters.length);
  let idx = 0;
  async function worker() {
    while (idx < chapters.length) {
      const i = idx++;
      const chapter = chapters[i];
      const { segments, $ } = extractSegments(chapter.html);
      if (segments.length === 0) {
        results[i] = { path: chapter.path, html: chapter.html };
        continue;
      }
      const translations = await translator.translateText(segments, targetLanguage);
      results[i] = { path: chapter.path, html: applyTranslations($, translations) };
      logger.log('TranslateChapters', `chapter ${i + 1}/${chapters.length} ${chapter.path} segments=${segments.length}`);
    }
  }
  await Promise.all(Array.from({ length: CHAPTER_CONCURRENCY }, () => worker()));
  logger.log('TranslateChapters', `done in ${Date.now() - start}ms`);
  return results;
}

export async function translateEpub(
  epubBuffer: Buffer,
  targetLanguage: string,
  translator: Translator
): Promise<Buffer> {
  const { zip, chapters } = await loadEpubChapters(epubBuffer);
  const updated = await translateChapters(chapters, targetLanguage, translator);
  return writeEpubFromZip(zip, updated);
}
