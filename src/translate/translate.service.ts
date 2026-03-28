import { Inject, Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import type { Translator } from '../services/ai/types';
import { translateChapters } from '../services/translate';
import { EpubService } from '../epub/epub.service';

export const TRANSLATOR = Symbol('TRANSLATOR');

const RESULT_DIR = path.join(process.cwd(), 'result');

@Injectable()
export class TranslateService {
  private readonly logger = new Logger(TranslateService.name);

  constructor(
    private readonly epubService: EpubService,
    @Inject(TRANSLATOR) private readonly translator: Translator,
  ) {}

  async translateEpub(epubBuffer: Buffer, targetLanguage: string): Promise<Buffer> {
    const start = Date.now();
    this.logger.log('translateEpub', `input size=${epubBuffer.length} targetLanguage=${targetLanguage}`);
    const { zip, chapters } = await this.epubService.loadEpubChapters(epubBuffer);
    this.logger.log('translateEpub', `loaded ${chapters.length} chapters`);
    const updated = await translateChapters(chapters, targetLanguage, this.translator);
    const buffer = await this.epubService.writeEpubFromZip(zip, updated);
    this.logger.log('translateEpub', `done in ${Date.now() - start}ms output size=${buffer.length}`);
    fs.mkdirSync(RESULT_DIR, { recursive: true });
    const filename = `translated-${Date.now()}.epub`;
    const outPath = path.join(RESULT_DIR, filename);
    fs.writeFileSync(outPath, buffer);
    this.logger.log('translateEpub', `saved to ${outPath}`);
    return buffer;
  }
}
