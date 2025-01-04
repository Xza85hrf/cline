const fs = require('fs');
const path = require('path');

// Source and destination directories
const sourceDir = path.resolve(__dirname, '../../src/shared');
const destDir = path.resolve(__dirname, '../src/shared');

// Create destination directory if it doesn't exist
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// Copy and transform files
function copyAndTransform(file) {
  // Skip package.json
  if (file === 'package.json') {
    return;
  }

  const sourcePath = path.join(sourceDir, file);
  const destPath = path.join(destDir, file);
  
  if (fs.statSync(sourcePath).isDirectory()) {
    if (!fs.existsSync(destPath)) {
      fs.mkdirSync(destPath, { recursive: true });
    }
    fs.readdirSync(sourcePath).forEach(childFile => {
      copyAndTransform(path.join(file, childFile));
    });
  } else {
    let content = fs.readFileSync(sourcePath, 'utf8');
    
    // Transform any imports from outside src to relative imports
    content = content.replace(
      /from\s+['"](\.\.\/)*src\/shared\//g,
      'from \'../'
    );
    content = content.replace(
      /from\s+['"](\.\.\/)+shared\//g,
      'from \'../'
    );
    
    fs.writeFileSync(destPath, content);
  }
}

// Start copying from root of shared directory
fs.readdirSync(sourceDir).forEach(file => {
  copyAndTransform(file);
});

console.log('Shared files copied and transformed successfully');
