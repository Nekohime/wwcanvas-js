#!/usr/bin/env node

/*
  Based on MIT-licensed code from WideWorlds
  https://github.com/Blaxar/WideWorlds/blob/dev/LICENSE
*/

import SignGenerator from './sign-generator.js';
import readline from 'readline';
import clipboardy from 'clipboardy';

const sg = new SignGenerator();

// Parse command-line arguments
const args = process.argv.slice(2);
const options = {
  bg: '0000ff',
  fg: 'ffffff',
  width: 256,
  height: 256,
};

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg.startsWith('--bg=')) {
    options.bg = arg.substring(5);
  } else if (arg.startsWith('--fg=')) {
    options.fg = arg.substring(5);
  } else if (arg.startsWith('--width=')) {
    options.width = parseInt(arg.substring(8));
  } else if (arg.startsWith('--height=')) {
    options.height = parseInt(arg.substring(9));
  } else if (arg ==='--copy') {
    options.copyToClipboard = true;
  }
}

// Read input from stdin
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

let inputText = '';

rl.on('line', (line) => {
  inputText += sg.replaceCustomVariables(
      line, options.width, options.height, options.fg, options.bg,
  ) + '\n';
});

rl.on('close', () => {
  // Generate sign image and display
  const signText = inputText.trim();
  const imageBuffer = sg.generateSignImage(signText, options.width, options.height, options.fg, options.bg);
  const base64Image = 'data:image/png;base64,' + imageBuffer.toString('base64');
  console.log(base64Image)
  console.log(inputText.trim());
  // Copy to clipboard if flag is set
  if (options.copyToClipboard) {
    clipboardy.write(base64Image);
    console.log('Image data copied to clipboard.');
  }
});
