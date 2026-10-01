const fs = require('fs');

// Read compiled JS from dist or parse directly
const distJs = fs.readFileSync('./dist/assets/index-Dx5a7Dri.js', 'utf-8');

// Check what happens in dist code
console.log('Dist JS size:', distJs.length);
