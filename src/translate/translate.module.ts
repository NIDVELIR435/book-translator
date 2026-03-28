import { Module } from '@nestjs/common';
import { getTranslator } from '../services/ai';
import { TRANSLATOR, TranslateService } from './translate.service';
import { TranslateController } from './translate.controller';
import { EpubService } from '../epub/epub.service';

@Module({
  controllers: [TranslateController],
  providers: [
    EpubService,
    TranslateService,
    {
      provide: TRANSLATOR,
      useFactory: getTranslator,
    },
  ],
})
export class TranslateModule {}
