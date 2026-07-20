const fs = require('fs');
const path = require('path');

const appDir = path.join(__dirname, 'app');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir(appDir, (filePath) => {
  if (filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Clean up double borders and make border color more visible
    const patterns = [
      {
        old: 'border border-gray-100 dark:border-gray-800 border border-gray-100 dark:border-gray-800',
        new: 'border border-gray-200 dark:border-gray-800'
      },
      {
        old: 'border border-gray-100 dark:border-gray-800',
        new: 'border border-gray-200 dark:border-gray-800'
      },
      // Also catch any remaining shadows we might have missed
      {
        old: 'shadow-sm shadow-gray-20 dark:shadow-none0 dark:shadow-none',
        new: 'border border-gray-200 dark:border-gray-800'
      },
      {
        old: 'shadow-sm shadow-gray-200/50 dark:shadow-none',
        new: 'border border-gray-200 dark:border-gray-800'
      },
      {
        old: 'shadow-sm shadow-gray-20 dark:shadow-none',
        new: 'border border-gray-200 dark:border-gray-800'
      }
    ];
    
    let original = content;
    patterns.forEach(p => {
      content = content.split(p.old).join(p.new);
    });
    
    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Updated:', filePath);
    }
  }
});
