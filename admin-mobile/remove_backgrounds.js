const fs = require('fs');
const path = require('path');

const appDir = '/Users/cheolsovandara/Documents/D/Developments/2027/e-comerce/admin-mobile/app';

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Replace common background classes applied globally to screen containers
  content = content.replace(/className="flex-1 bg-system-bg dark:bg-black(\s?)/g, 'className="flex-1 bg-transparent$1');
  content = content.replace(/className="flex-1 bg-gray-50 dark:bg-black(\s?)/g, 'className="flex-1 bg-transparent$1');
  content = content.replace(/className="flex-row items-center justify-between px-4 pt-10 pb-4 bg-system-bg dark:bg-black/g, 'className="flex-row items-center justify-between px-4 pt-10 pb-4 bg-transparent');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

function traverseDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverseDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') && !fullPath.includes('index.tsx') && !fullPath.includes('_layout.tsx')) {
      processFile(fullPath);
    }
  }
}

traverseDirectory(appDir);
console.log('Background classes stripped successfully.');
