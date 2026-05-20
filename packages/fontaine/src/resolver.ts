import { ofetch } from 'ofetch';
import { joinURL } from 'ufo';
import { ResolverError } from './errors';

const MAGIC_NUMBERS = {
  TTF: [0x00, 0x01, 0x00, 0x00],
  OTF: [0x4F, 0x54, 0x54, 0x4F],
  WOFF: [0x77, 0x4F, 0x46, 0x31],
  WOFF2: [0x77, 0x4F, 0x46, 0x32],
};

export class SourceResolver {
  async resolve(url: string): Promise<Uint8Array> {
    const normalizedUrl = joinURL(url);
    
    try {
      const buffer = await ofetch(normalizedUrl, {
        responseType: 'arrayBuffer',
      });

      const uint8 = new Uint8Array(buffer as ArrayBuffer);
      this.validateSignature(uint8);
      
      return uint8;
    } catch (error) {
      if (error instanceof ResolverError) throw error;
      throw new ResolverError(`Failed to resolve font source: ${normalizedUrl}`);
    }
  }

  private validateSignature(buffer: Uint8Array): void {
    const signature = Array.from(buffer.slice(0, 4));
    const isValid = Object.values(MAGIC_NUMBERS).some(magic => 
      magic.every((byte, i) => byte === signature[i])
    );

    if (!isValid) {
      throw new ResolverError('Invalid font file signature: buffer does not match known font magic numbers');
    }
  }
}
