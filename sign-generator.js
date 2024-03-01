/*
  Based on MIT-licensed code from WideWorlds
  https://github.com/Blaxar/WideWorlds/blob/dev/LICENSE
*/

import readline from 'readline';
import {createCanvas, registerFont} from 'canvas';

/*
 TODO:
 - Background images
 - Foreground images
 - Emojis don't work :(
*/

class SignGenerator {
  // lineHeightRatio = 1.2;
  // maxCharSizeRatio = 0.4;

  constructor() {
    this.lineHeightRatio = 1.2;
    this.maxCharSizeRatio = 0.4;

    // Load a font if needed
    // Example: registerFont('path/to/font.ttf', { family: 'FontName' });
  }

  getCssFontProperty(fontSize) {
    return `bold ${fontSize}px Arial, Helvetica, sans-serif`;
  }

  measureLine(line, fontSize, canvasCtx) {
    canvasCtx.font = this.getCssFontProperty(fontSize);
    return canvasCtx.measureText(line).width;
  }

  formatSignLines(text, canvasCtx) {
    const finalText = text.replaceAll('\r\n', '\n').trim();
    const {width, height} = canvasCtx.canvas;
    const minSpan = width < height ? width : height;

    let fontSize = parseInt(minSpan * this.maxCharSizeRatio);

    if (!finalText.length) return {lines: [''], fontSize, maxLineWidth: width};

    let lineHeight = 0;
    let maxLineWidth = 0;
    let lines = [''];

    // Look for naturally-occurring line breaks
    const tmpLines = finalText.split('\n');

    // Find a fitting font size
    do {
      lineHeight = parseInt(fontSize * this.lineHeightRatio);
      maxLineWidth = 0;
      let currentLineId = 0;
      lines = [''];
      let retry = false;

      const startNewLine = () => {
        const newWidth = getNewLineWidth();
        if (newWidth > maxLineWidth) maxLineWidth = newWidth;
        lines[currentLineId] = lines[currentLineId].trim();
        lines.push('');
        currentLineId++;
      };

      const getNewLineWidth = (newWord = '') => {
        const fullLine = (lines[currentLineId] + newWord).trim();
        return this.measureLine(fullLine, fontSize, canvasCtx);
      };

      // Try to fit the text in the canvas
      for (const tmpLine of tmpLines) {
        for (const word of tmpLine.split(' ')) {
          if (this.measureLine(word, fontSize, canvasCtx) > width) {
            // Retry right away if the word itself is too big for the container
            retry = true;
            break;
          }

          if (getNewLineWidth(word) > width) {
            startNewLine();
          }

          lines[currentLineId] += `${word} `;

          if (lines.length * lineHeight > height) {
            // Too many lines overflowing on the height: try a smaller font size
            retry = true;
            break;
          }
        }

        if (retry) break;
        startNewLine();
      }

      if (retry) continue;

      // At this point: we're out of words to dispatch and yet everything fits:
      // this simply means we can stop
      lines[currentLineId] = lines[currentLineId].trim();
      if (!lines[currentLineId].length) lines.length--;

      break;
    } while (--fontSize > 0);

    return {lines, fontSize, maxLineWidth};
  }

  makeSignCanvas(canvasCtx, lines, fontSize, maxLineWidth, textColor = 'ffffff') {
    if (!lines.length) return;

    canvasCtx.font = this.getCssFontProperty(fontSize);
    canvasCtx.fillStyle = '#' + textColor;
    canvasCtx.textBaseline = 'top';

    const {width, height} = canvasCtx.canvas;

    const lineHeight = parseInt(fontSize * this.lineHeightRatio);
    const descent = canvasCtx.measureText(lines[lines.length - 1]).actualBoundingBoxDescent;

    const spanHeight = lineHeight * (lines.length - 1) + descent;
    const marginTop = (height - spanHeight) / 2;
    const marginLeft = (width - maxLineWidth) / 2;

    lines.forEach((line, i) => {
      const leftOffset = (maxLineWidth - canvasCtx.measureText(line).width) / 2;
      const topOffset = i * lineHeight;
      canvasCtx.fillText(line, marginLeft + leftOffset, marginTop + topOffset);
    });
  }

  generateSignImage(text, width, height, textColor, bgColor = '0000ff') {
    const canvas = createCanvas(width, height);
    const canvasCtx = canvas.getContext('2d');

    canvasCtx.fillStyle = '#' + bgColor;
    canvasCtx.fillRect(0, 0, width, height);

    const {lines, fontSize, maxLineWidth} = this.formatSignLines(text, canvasCtx);
    this.makeSignCanvas(canvasCtx, lines, fontSize, maxLineWidth, textColor);

    const buffer = canvas.toBuffer('image/png');
    return buffer;
  }

  replaceCustomVariables(text, signWidth, signHeight, textColor, bgColor) {
    const currentDate = new Date();
    const currentTime = currentDate.toLocaleTimeString();
    const currentDateStr = currentDate.toLocaleDateString();
    const monthName = currentDate.toLocaleDateString('en-US', {month: 'long'});

    return text
        .replaceAll('{{TIME}}', currentTime)
        .replaceAll('{{DATE}}', currentDateStr)
        .replaceAll('{{YEAR}}', currentDate.getFullYear())
        .replaceAll('{{MONTH}}', monthName)
        .replaceAll('{{DAY}}', currentDate.getDate())
        .replaceAll('{{SIGN_WIDTH}}', signWidth)
        .replaceAll('{{SIGN_HEIGHT}}', signHeight)
        .replaceAll('{{SIGN_PIXELS}}', signWidth * signHeight)
        .replaceAll('{{BGCOLOR}}', '#' + bgColor)
        .replaceAll('{{COLOR}}', '#' + textColor);
  }
}

export default SignGenerator;
