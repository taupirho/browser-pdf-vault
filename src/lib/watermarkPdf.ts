import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib-plus-encrypt";
import type { WatermarkOptions } from "@/components/WatermarkSettings";

export async function applyWatermark(
  pdfDoc: PDFDocument,
  options: WatermarkOptions
): Promise<void> {
  if (!options.enabled || !options.text.trim()) return;

  const pages = pdfDoc.getPages();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  for (const page of pages) {
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(options.text, options.fontSize);
    const textHeight = options.fontSize;

    let x: number;
    let y: number;
    let rotation = options.rotation;

    switch (options.position) {
      case 'diagonal':
        // Center of page with diagonal rotation
        x = width / 2 - textWidth / 2;
        y = height / 2;
        rotation = -45;
        break;
      case 'center':
        x = width / 2 - textWidth / 2;
        y = height / 2;
        break;
      case 'top-left':
        x = 40;
        y = height - 40 - textHeight;
        break;
      case 'top-right':
        x = width - textWidth - 40;
        y = height - 40 - textHeight;
        break;
      case 'bottom-left':
        x = 40;
        y = 40;
        break;
      case 'bottom-right':
        x = width - textWidth - 40;
        y = 40;
        break;
      default:
        x = width / 2 - textWidth / 2;
        y = height / 2;
    }

    page.drawText(options.text, {
      x,
      y,
      size: options.fontSize,
      font,
      color: rgb(options.color.r, options.color.g, options.color.b),
      opacity: options.opacity,
      rotate: degrees(rotation),
    });

    // For diagonal watermark, add additional instances for coverage
    if (options.position === 'diagonal') {
      // Top-left area
      page.drawText(options.text, {
        x: width * 0.15 - textWidth / 2,
        y: height * 0.75,
        size: options.fontSize,
        font,
        color: rgb(options.color.r, options.color.g, options.color.b),
        opacity: options.opacity,
        rotate: degrees(-45),
      });

      // Bottom-right area
      page.drawText(options.text, {
        x: width * 0.85 - textWidth / 2,
        y: height * 0.25,
        size: options.fontSize,
        font,
        color: rgb(options.color.r, options.color.g, options.color.b),
        opacity: options.opacity,
        rotate: degrees(-45),
      });
    }
  }
}
