import * as cheerio from 'cheerio';

const TRANSLATABLE_SELECTOR = 'p, h1, h2, h3, h4, h5, h6, li, td, th, figcaption';

export function extractSegments(html: string): { segments: string[]; $: cheerio.CheerioAPI } {
  const $ = cheerio.load(html, { xmlMode: true });
  const segments: string[] = [];
  $(TRANSLATABLE_SELECTOR).each((_, el) => {
    const text = $(el).text().trim();
    if (text) segments.push(text);
  });
  return { segments, $ };
}

export function applyTranslations(
  $: cheerio.CheerioAPI,
  translations: string[],
  selector: string = TRANSLATABLE_SELECTOR
): string {
  let i = 0;
  $(selector).each((_, el) => {
    const $el = $(el);
    const text = $el.text().trim();
    if (text && i < translations.length) {
      $el.text(translations[i]);
      i++;
    }
  });
  return $.html();
}
