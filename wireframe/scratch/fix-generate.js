const fs = require('fs');
const path = require('path');

const targetFilePath = path.join(__dirname, '..', 'generate-html.js');
const b6FilePath = path.join(__dirname, 'b6_new.txt');
const b11FilePath = path.join(__dirname, 'b11_new.txt');

// Read files
let targetContent = fs.readFileSync(targetFilePath, 'utf8');
const b6Content = fs.readFileSync(b6FilePath, 'utf8');
const b11Content = fs.readFileSync(b11FilePath, 'utf8');

// Replace b6 block
const b6StartTag = "      } else if (p.id === 'b6') { // Deposit / NIPL";
const b6EndTag = "      } else if (p.id === 'b7') { // Bidding Room";

const b6StartIndex = targetContent.indexOf(b6StartTag);
const b6EndIndex = targetContent.indexOf(b6EndTag);

if (b6StartIndex === -1 || b6EndIndex === -1) {
  console.error('Could not find b6 boundary tags!');
  process.exit(1);
}

const b6Block = `${b6StartTag}\n        specificContent = \`\n${b6Content}\n        \`;\n`;
targetContent = targetContent.slice(0, b6StartIndex) + b6Block + targetContent.slice(b6EndIndex);

// Re-read or calculate b11 index in the modified content
const b11StartTag = "      } else if (p.id === 'b11') { // Pickup";
const b11EndTag = "      } else if (p.id === 'b12') { // Riwayat Lelang";

const b11StartIndex = targetContent.indexOf(b11StartTag);
const b11EndIndex = targetContent.indexOf(b11EndTag);

if (b11StartIndex === -1 || b11EndIndex === -1) {
  console.error('Could not find b11 boundary tags!');
  process.exit(1);
}

const b11Block = `${b11StartTag}\n        specificContent = \`\n${b11Content}\n        \`;\n`;
targetContent = targetContent.slice(0, b11StartIndex) + b11Block + targetContent.slice(b11EndIndex);

// Write back
fs.writeFileSync(targetFilePath, targetContent, 'utf8');
console.log('Successfully injected b6 and b11 blocks into generate-html.js!');
