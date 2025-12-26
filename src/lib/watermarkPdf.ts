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
    
    let x: number;
    let y: number;
    let rotation = options.rotation;
    let fontSize = options.fontSize;

    if (options.position === 'diagonal') {
      // Calculate the diagonal length of the page
      const diagonal = Math.sqrt(width * width + height * height);
      
      // Scale font size to make text span most of the diagonal
      const textWidth = font.widthOfTextAtSize(options.text, options.fontSize);
      const scaleFactor = (diagonal * 0.8) / textWidth; // 80% of diagonal
      fontSize = Math.min(options.fontSize * scaleFactor, 200); // Cap at 200pt
      
      // Center the text on the page
      x = width / 2;
      y = height / 2;
      rotation = -45;
      
      // Draw single centered diagonal watermark
      page.drawText(options.text, {
        x: x - font.widthOfTextAtSize(options.text, fontSize) / 2,
        y: y - fontSize / 2,
        size: fontSize,
        font,
        color: rgb(options.color.r, options.color.g, options.color.b),
        opacity: options.opacity,
        rotate: degrees(rotation),
      });
    } else {
      // Non-diagonal positions use the specified font size
      const textWidth = font.widthOfTextAtSize(options.text, fontSize);
      const textHeight = fontSize;

      switch (options.position) {
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
        size: fontSize,
        font,
        color: rgb(options.color.r, options.color.g, options.color.b),
        opacity: options.opacity,
        rotate: degrees(rotation),
      });
    }
  }
}
