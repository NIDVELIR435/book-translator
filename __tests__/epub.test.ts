import JSZip from 'jszip';
import { loadEpubChapters, writeEpubFromZip } from '../src/services/epub';

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
    `<?xml version="1.0"?><html xmlns="http://www.w3.org/1999/xhtml"><body><p>Hello world</p><h1>Title</h1></body></html>`
  );
  return zip.generateAsync({ type: 'nodebuffer' });
}

describe('epub service', () => {
  it('parses spine and returns chapter html', async () => {
    const buffer = await createFixtureEpub();
    const { zip, opfDir, chapters } = await loadEpubChapters(buffer);
    expect(opfDir).toBe('OEBPS');
    expect(chapters).toHaveLength(1);
    expect(chapters[0].path).toBe('OEBPS/chap1.xhtml');
    expect(chapters[0].html).toContain('Hello world');
  });

  it('writeEpubFromZip returns buffer with updated chapter', async () => {
    const buffer = await createFixtureEpub();
    const { zip, chapters } = await loadEpubChapters(buffer);
    const updated = await writeEpubFromZip(zip, [
      { path: chapters[0].path, html: chapters[0].html.replace('Hello world', 'Translated') },
    ]);
    expect(Buffer.isBuffer(updated)).toBe(true);
    const outZip = await JSZip.loadAsync(updated);
    const html = await outZip.file('OEBPS/chap1.xhtml')?.async('string');
    expect(html).toContain('Translated');
  });

  it('throws on invalid epub without container', async () => {
    const zip = new JSZip();
    zip.file('mimetype', 'application/epub+zip');
    const buffer = await zip.generateAsync({ type: 'nodebuffer' });
    await expect(loadEpubChapters(buffer)).rejects.toThrow('missing META-INF/container.xml');
  });
});
