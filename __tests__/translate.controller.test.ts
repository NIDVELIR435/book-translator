import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { TranslateController } from '../src/translate/translate.controller';
import { TranslateService } from '../src/translate/translate.service';

describe('TranslateController', () => {
  let controller: TranslateController;

  const mockTranslateService = {
    translateEpub: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [TranslateController],
      providers: [
        {
          provide: TranslateService,
          useValue: mockTranslateService,
        },
      ],
    }).compile();
    controller = module.get(TranslateController);
    jest.clearAllMocks();
  });

  it('throws when file is missing', async () => {
    await expect(
      controller.translate(undefined as any, { targetLanguage: 'es' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('returns StreamableFile when file and targetLanguage are valid', async () => {
    const buffer = Buffer.from('epub');
    mockTranslateService.translateEpub.mockResolvedValue(buffer);
    const file = {
      buffer,
      mimetype: 'application/epub+zip',
      originalname: 'book.epub',
    } as Express.Multer.File;
    const result = await controller.translate(file, { targetLanguage: 'es' });
    expect(mockTranslateService.translateEpub).toHaveBeenCalledWith(
      buffer,
      'es',
    );
    expect(result).toBeDefined();
  });
});
