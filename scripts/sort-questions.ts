
import * as fs from 'fs';
import * as path from 'path';

const filePath = path.join(process.cwd(), 'generated-questions.txt');
const content = fs.readFileSync(filePath, 'utf-8');

const lines = content.split('\n');
const headerEndIndex = lines.findIndex((line, index) => line.startsWith('====') && index > 2);
const header = lines.slice(0, headerEndIndex + 1);
const questionsContent = lines.slice(headerEndIndex + 1).join('\n');

const questionBlocks = [];
let currentBlock = [];
let currentBloom = 0;

const questionRegex = /^\d+\. \[(.*?)\] \[Bloom (\d+)\]/;

lines.slice(headerEndIndex + 1).forEach(line => {
    if (questionRegex.test(line)) {
        if (currentBlock.length > 0) {
            const blockContent = currentBlock.join('\n');
            if (questionRegex.test(blockContent.trim())) {
                questionBlocks.push({ content: blockContent, bloom: currentBloom });
            }
        }
        currentBlock = [line];
        const match = line.match(questionRegex);
        if (match) {
            currentBloom = parseInt(match[2]);
        }
    } else {
        currentBlock.push(line);
    }
});

// Push the last block
if (currentBlock.length > 0) {
    const blockContent = currentBlock.join('\n');
    if (questionRegex.test(blockContent.trim())) {
        questionBlocks.push({ content: blockContent, bloom: currentBloom });
    }
}

// Sort by Bloom level
questionBlocks.sort((a, b) => a.bloom - b.bloom);

console.log(`Found ${questionBlocks.length} valid questions.`);

// Reconstruct file
let newContent = header.join('\n') + '\n\n';

questionBlocks.forEach((block, index) => {
    // Renumber question
    // Split into lines to find the first line (the header)
    const blockLines = block.content.trim().split('\n');
    const oldLine = blockLines[0];
    const rest = blockLines.slice(1).join('\n');

    // Replace numbering: "2. [mcq..." -> "1. [mcq..."
    const newLine = oldLine.replace(/^\d+\./, `${index + 1}.`);

    newContent += newLine + '\n' + rest + '\n\n';
});

fs.writeFileSync(filePath, newContent);
console.log(`Sorted ${questionBlocks.length} questions by Bloom level.`);
