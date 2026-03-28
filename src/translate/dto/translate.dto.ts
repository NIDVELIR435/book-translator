import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class TranslateDto {
  @ApiProperty({ example: 'es', description: 'Target language code (e.g. es, fr, en-US)' })
  @IsString()
  @MinLength(2)
  @MaxLength(10)
  @Matches(/^[a-z]{2}(-[A-Za-z0-9]+)?$/, {
    message: 'targetLanguage must be a valid locale (e.g. es, fr, en-US)',
  })
  targetLanguage!: string;
}
