import QRCode from 'qrcode';

/**
 * QR Code generation utilities for poll sharing
 */

export interface QRCodeOptions {
  size?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  type?: 'image/png' | 'image/jpeg' | 'image/webp';
  quality?: number;
}

/**
 * Generate QR code as data URL for poll sharing
 */
export async function generatePollQRCode(
  pollSlug: string,
  options: QRCodeOptions = {}
): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const pollUrl = `${baseUrl}/vote/${pollSlug}`;

  const defaultOptions = {
    width: options.size || 256,
    margin: options.margin || 2,
    color: {
      dark: options.color?.dark || '#000000',
      light: options.color?.light || '#ffffff',
    },
    errorCorrectionLevel: options.errorCorrectionLevel || 'M',
    type: options.type || 'image/png',
    quality: options.quality || 0.92,
  };

  try {
    const qrCodeDataUrl = await QRCode.toDataURL(pollUrl, defaultOptions);
    return qrCodeDataUrl;
  } catch (error) {
    console.error('Failed to generate QR code:', error);
    throw new Error('QR code generation failed');
  }
}

/**
 * Generate QR code as SVG string
 */
export async function generatePollQRCodeSVG(
  pollSlug: string,
  options: Omit<QRCodeOptions, 'type' | 'quality'> = {}
): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const pollUrl = `${baseUrl}/vote/${pollSlug}`;

  const defaultOptions = {
    width: options.size || 256,
    margin: options.margin || 2,
    color: {
      dark: options.color?.dark || '#000000',
      light: options.color?.light || '#ffffff',
    },
    errorCorrectionLevel: options.errorCorrectionLevel || 'M',
  };

  try {
    const svgString = await QRCode.toString(pollUrl, {
      ...defaultOptions,
      type: 'svg',
    });
    return svgString;
  } catch (error) {
    console.error('Failed to generate QR code SVG:', error);
    throw new Error('QR code SVG generation failed');
  }
}

/**
 * Generate QR code for download as buffer
 */
export async function generatePollQRCodeBuffer(
  pollSlug: string,
  options: QRCodeOptions = {}
): Promise<Buffer> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const pollUrl = `${baseUrl}/vote/${pollSlug}`;

  const defaultOptions = {
    width: options.size || 512,
    margin: options.margin || 2,
    color: {
      dark: options.color?.dark || '#000000',
      light: options.color?.light || '#ffffff',
    },
    errorCorrectionLevel: options.errorCorrectionLevel || 'H',
  };

  try {
    const buffer = await QRCode.toBuffer(pollUrl, defaultOptions);
    return buffer;
  } catch (error) {
    console.error('Failed to generate QR code buffer:', error);
    throw new Error('QR code buffer generation failed');
  }
}

/**
 * Validate QR code content
 */
export function validateQRCodeContent(content: string): boolean {
  try {
    const url = new URL(content);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return url.origin === new URL(baseUrl).origin && url.pathname.startsWith('/vote/');
  } catch {
    return false;
  }
}

/**
 * Extract poll slug from QR code URL
 */
export function extractPollSlugFromQRUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');

    if (pathParts[1] === 'vote' && pathParts[2]) {
      return pathParts[2];
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Generate branded QR code with logo overlay
 */
export async function generateBrandedQRCode(
  pollSlug: string,
  logoDataUrl?: string,
  options: QRCodeOptions = {}
): Promise<string> {
  const baseQRCode = await generatePollQRCode(pollSlug, {
    ...options,
    errorCorrectionLevel: 'H', // Higher error correction for logo overlay
  });

  if (!logoDataUrl) {
    return baseQRCode;
  }

  // This would require canvas manipulation in a real implementation
  // For now, return the base QR code
  // TODO: Implement logo overlay using canvas or image processing library
  return baseQRCode;
}

/**
 * QR Code styling presets
 */
export const QR_CODE_PRESETS = {
  default: {
    size: 256,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' },
    errorCorrectionLevel: 'M' as const,
  },
  high_quality: {
    size: 512,
    margin: 3,
    color: { dark: '#000000', light: '#ffffff' },
    errorCorrectionLevel: 'H' as const,
  },
  branded: {
    size: 400,
    margin: 4,
    color: { dark: '#1f2937', light: '#ffffff' },
    errorCorrectionLevel: 'H' as const,
  },
  social: {
    size: 300,
    margin: 2,
    color: { dark: '#374151', light: '#f9fafb' },
    errorCorrectionLevel: 'M' as const,
  },
  print: {
    size: 600,
    margin: 4,
    color: { dark: '#000000', light: '#ffffff' },
    errorCorrectionLevel: 'H' as const,
  },
} as const;

/**
 * Generate multiple QR code formats for a poll
 */
export async function generateQRCodeBundle(
  pollSlug: string,
  preset: keyof typeof QR_CODE_PRESETS = 'default'
) {
  const options = QR_CODE_PRESETS[preset];

  const [dataUrl, svg, buffer] = await Promise.all([
    generatePollQRCode(pollSlug, options),
    generatePollQRCodeSVG(pollSlug, options),
    generatePollQRCodeBuffer(pollSlug, options),
  ]);

  return {
    dataUrl,
    svg,
    buffer,
    options,
  };
}

/**
 * Get QR code download filename
 */
export function getQRCodeFilename(
  pollTitle: string,
  format: 'png' | 'svg' | 'jpg' = 'png'
): string {
  const sanitizedTitle = pollTitle
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();

  const timestamp = new Date().toISOString().split('T')[0];
  return `poll-qr-${sanitizedTitle}-${timestamp}.${format}`;
}
