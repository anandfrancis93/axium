const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'app', 'globals.css');
const content = fs.readFileSync(filePath, 'utf8');

let openBraces = 0;
let closeBraces = 0;
let lineNum = 1;
let stack = [];

const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '{') {
            openBraces++;
            stack.push({ line: i + 1, col: j + 1 });
        } else if (char === '}') {
            closeBraces++;
            if (stack.length > 0) {
                stack.pop();
            } else {
                console.log(`Extra closing brace at line ${i + 1}, col ${j + 1}`);
            }
        }
    }
}

console.log(`Total Open: ${openBraces}`);
console.log(`Total Close: ${closeBraces}`);
if (stack.length > 0) {
    console.log('Unclosed braces at:');
    stack.forEach(s => console.log(`Line ${s.line}, Col ${s.col}`));
} else {
    console.log('Braces are balanced.');
}
