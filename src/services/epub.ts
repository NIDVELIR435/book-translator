import JSZip from 'jszip';
import { XMLParser } from 'fast-xml-parser';
import { logger } from '../lib/logger';

export interface Chapter {
  path: string;
  html: string;
}

function resolvePath(base: string, href: string): string {
  const parts = base.replace(/\/$/, '').split('/');
  const rel = href.split('/');
  for (const p of rel) {
    if (p === '..') parts.pop();
    else if (p !== '.' && p !== '') parts.push(p);
  }
  return parts.join('/');
}

export async function loadEpubChapters(epubBuffer: Buffer): Promise<{ zip: JSZip; opfDir: string; chapters: Chapter[] }> {
  const zip = await JSZip.loadAsync(epubBuffer);
  const containerXml = await zip.file('META-INF/container.xml')?.async('string');
  if (!containerXml) throw new Error('Invalid EPUB: missing META-INF/container.xml');

  const parser = new XMLParser({ ignoreDeclaration: true, ignoreAttributes: false });
  const container = parser.parse(containerXml);
  const rootfiles = container?.container?.rootfiles;
  const rootfile = Array.isArray(rootfiles?.rootfile) ? rootfiles.rootfile[0] : rootfiles?.rootfile;
  const opfPath = rootfile?.['@_full-path'] ?? rootfile?.fullPath ?? rootfile?.['full-path'];
  if (!opfPath) throw new Error('Invalid EPUB: no rootfile full-path in container.xml');

  const opfDir = opfPath.includes('/') ? opfPath.replace(/\/[^/]+$/, '') : '';
  const opfXml = await zip.file(opfPath)?.async('string');
  if (!opfXml) throw new Error('Invalid EPUB: missing content.opf');

  const opf = parser.parse(opfXml);
  const pkg = opf?.package ?? opf?.opf ?? opf;
  const manifest = pkg?.manifest ?? pkg?.manifest;
  let items = manifest?.item ?? [];
  if (!Array.isArray(items)) items = [items];
  const manifestById: Record<string, { href: string }> = {};
  for (const it of items) {
    const id = it['@_id'] ?? it.id;
    const href = it['@_href'] ?? it.href;
    if (id && href) manifestById[id] = { href };
  }

  const spine = pkg?.spine ?? pkg?.spine;
  let itemrefs = spine?.itemref ?? [];
  if (!Array.isArray(itemrefs)) itemrefs = [itemrefs];
  const chapterPaths: string[] = [];
  for (const ref of itemrefs) {
    const idref = ref['@_idref'] ?? ref.idref;
    const item = manifestById[idref];
    if (item) {
      const fullPath = resolvePath(opfDir, item.href);
      chapterPaths.push(fullPath);
    }
  }

  const chapters: Chapter[] = [];
  for (const path of chapterPaths) {
    const html = await zip.file(path)?.async('string');
    if (html != null) chapters.push({ path, html });
  }
  logger.log('Epub', `loaded ${chapters.length} chapters from spine`);
  return { zip, opfDir, chapters };
}

export async function writeEpubFromZip(
  zip: JSZip,
  updatedChapters: { path: string; html: string }[]
): Promise<Buffer> {
  logger.log('Epub', `writing ${updatedChapters.length} chapters to zip`);
  for (const { path, html } of updatedChapters) {
    zip.file(path, html);
  }
  const buffer = await zip.generateAsync({ type: 'nodebuffer' });
  logger.log('Epub', `zip generated size=${buffer.length}`);
  return buffer;
}
