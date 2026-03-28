import JSZip from 'jszip';
import { translateEpub } from '../src/services/translate';
import type { Translator } from '../src/services/ai/types';

async function createFixtureEpub(): Promise<Buffer> {
  const zip = new JSZip();
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });
  zip.file(
    'META-INF/container.xml',
    `<?xml version="1.0"?>
<container xmlns="urn:oasis:names:tc:opendocument:xmlns:container" version="1.0">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`
  );
  zip.file(
    'OEBPS/content.opf',
    `<?xml version="1.0"?>
<package xmlns="http://www.idpf.org/2007/opf" version="2.0">
  <manifest>
    <item id="ch1" href="chap1.xhtml" media-type="application/xhtml+xml"/>
  </manifest>
  <spine>
    <itemref idref="ch1"/>
  </spine>
</package>`
  );
  zip.file(
    'OEBPS/chap1.xhtml',
    `<?xml version="1.0"?><html xmlns="http://www.w3.org/1999/xhtml"><body><p>Hello</p><p>World</p></body></html>`
  );
  return zip.generateAsync({ type: 'nodebuffer' });
}

const mockTranslator: Translator = {
  async translateText(segments: string[]): Promise<string[]> {
    return segments.map((s) => `[${s}]`);
  },
};

describe('translate service', () => {
  it('returns valid epub with translated content', async () => {
    const buffer = await createFixtureEpub();
    const result = await translateEpub(buffer, 'es', mockTranslator);
    expect(Buffer.isBuffer(result)).toBe(true);
    const zip = await JSZip.loadAsync(result);
    const html = await zip.file('OEBPS/chap1.xhtml')?.async('string');
    expect(html).toContain('[Hello]');
    expect(html).toContain('[World]');
  });
});
