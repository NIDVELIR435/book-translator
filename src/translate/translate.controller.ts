import {
  BadRequestException,
  Controller,
  Logger,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
  StreamableFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiConsumes,
  ApiBody,
  ApiProduces,
  ApiResponse,
} from '@nestjs/swagger';
import multer from 'multer';
import { TranslateService } from './translate.service';
import { TranslateDto } from './dto/translate.dto';

@ApiTags('translate')
@Controller('translate')
export class TranslateController {
  private readonly logger = new Logger(TranslateController.name);

  constructor(private readonly translateService: TranslateService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.memoryStorage(),
      limits: { fileSize: 50 * 1024 * 1024 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'targetLanguage'],
      properties: {
        file: { type: 'string', format: 'binary', description: 'EPUB file' },
        targetLanguage: { type: 'string', example: 'es' },
      },
    },
  })
  @ApiProduces('application/epub+zip')
  @ApiResponse({ status: 200, description: 'Translated EPUB file' })
  @ApiResponse({ status: 400, description: 'Bad request (missing file, invalid type or targetLanguage)' })
  @ApiResponse({ status: 500, description: 'Translation failed' })
  async translate(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: TranslateDto,
  ): Promise<StreamableFile> {
    if (!file) {
      this.logger.warn('Translate rejected: missing file');
      throw new BadRequestException('Missing file');
    }
    const isEpub =
      file.mimetype === 'application/epub+zip' ||
      file.originalname?.toLowerCase().endsWith('.epub');
    if (!isEpub) {
      this.logger.warn('Translate rejected: not an EPUB', file.originalname);
      throw new BadRequestException('File must be an EPUB');
    }
    this.logger.log(
      'Translate request',
      `file=${file.originalname} size=${file.size} targetLanguage=${dto.targetLanguage}`,
    );
    let buffer: Buffer;
    try {
      buffer = await this.translateService.translateEpub(
        file.buffer,
        dto.targetLanguage,
      );
    } catch (err) {
      this.logger.error(
        'Translate failed',
        err instanceof Error ? err.message : String(err),
      );
      throw err;
    }
    this.logger.log('Translate done', `output size=${buffer.length}`);
    return new StreamableFile(buffer, {
      type: 'application/epub+zip',
      disposition: 'attachment; filename="translated.epub"',
    });
  }
}
