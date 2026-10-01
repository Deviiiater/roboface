const fs = require('fs');

// Extract studentsData
const dataContent = fs.readFileSync('./src/data/studentsData.ts', 'utf-8');

// We can compile TypeScript using esbuild / ts-node or evaluate with tsx
console.log('Testing with studentsData...');
