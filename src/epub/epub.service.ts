import { Injectable } from '@nestjs/common';
import {
  loadEpubChapters as loadChapters,
  writeEpubFromZip as writeZip,
} from '../services/epub';

@Injectable()
export class EpubService {
  loadEpubChapters = loadChapters;
  writeEpubFromZip = writeZip;
}
