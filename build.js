const fs = require('node:fs');
const path = require('node:path');

const projectDirectory = __dirname;
const outputDirectory = path.join(projectDirectory, 'dist');

fs.mkdirSync(outputDirectory, { recursive: true });

for (const entry of ['index.html', 'assets']) {
  fs.cpSync(
    path.join(projectDirectory, entry),
    path.join(outputDirectory, entry),
    { recursive: true }
  );
}

console.log('Static site built in dist/.');
