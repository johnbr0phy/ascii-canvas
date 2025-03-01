// Characters for ASCII art, ordered by visual density
const chars = [' ', '.', ':', '-', '=', '+', '*', '#', '%', '@'];

// Hash function for deterministic randomness based on (x, y)
function hash(x, y) {
    let n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return n - Math.floor(n); // Returns a value between 0 and 1
}

// Get an ASCII character for a given (x, y) position
function getChar(x, y) {
    const value = hash(x, y);
    const index = Math.floor(value * chars.length);
    return chars[index];
}

const container = document.getElementById('container');

// Measure character width
const tempSpan = document.createElement('span');
tempSpan.style.fontFamily = 'monospace';
tempSpan.style.fontSize = '16px';
tempSpan.style.position = 'absolute';
tempSpan.style.visibility = 'hidden';
tempSpan.textContent = 'a';
document.body.appendChild(tempSpan);
const charWidth = tempSpan.getBoundingClientRect().width;
document.body.removeChild(tempSpan);

// Measure row height
const tempRow = document.createElement('div');
tempRow.className = 'row';
tempRow.textContent = 'a';
container.appendChild(tempRow);
const rowHeight = tempRow.getBoundingClientRect().height;
container.removeChild(tempRow);

// Calculate initial number of columns and rows
const viewportWidth = container.clientWidth;
const viewportHeight = container.clientHeight;
const initialNumCols = Math.ceil(viewportWidth / charWidth) + 20; // Extra for scrolling
const initialNumRows = Math.ceil(viewportHeight / rowHeight) + 20; // Extra for scrolling

// Initialize bounds of the generated content
let minX = 0;
let maxX = initialNumCols - 1;
let minY = 0;
let maxY = initialNumRows - 1;

// Generate initial rows
for (let y = minY; y <= maxY; y++) {
    const row = document.createElement('div');
    row.className = 'row';
    let rowText = '';
    for (let x = minX; x <= maxX; x++) {
        rowText += getChar(x, y);
    }
    row.textContent = rowText;
    container.appendChild(row);
}

// Scroll event listener
container.addEventListener('scroll', () => {
    const scrollLeft = container.scrollLeft;
    const scrollTop = container.scrollTop;
    const scrollWidth = container.scrollWidth;
    const scrollHeight = container.scrollHeight;
    const clientWidth = container.clientWidth;
    const clientHeight = container.clientHeight;
    const threshold = 200; // Pixels from edge to trigger new content

    if (scrollLeft < threshold) addColumnsLeft();
    if (scrollTop < threshold) addRowsAbove();
    if (scrollLeft > scrollWidth - clientWidth - threshold) addColumnsRight();
    if (scrollTop > scrollHeight - clientHeight - threshold) addRowsBelow();
});

// Functions to add new content
function addColumnsLeft() {
    const numToAdd = 10;
    const newMinX = minX - numToAdd;
    for (let y = minY; y <= maxY; y++) {
        let newLeft = '';
        for (let x = newMinX; x < minX; x++) {
            newLeft += getChar(x, y);
        }
        const row = container.children[y - minY];
        row.textContent = newLeft + row.textContent;
    }
    minX = newMinX;
    container.scrollLeft += numToAdd * charWidth; // Keep view stable
}

function addColumnsRight() {
    const numToAdd = 10;
    const newMaxX = maxX + numToAdd;
    for (let y = minY; y <= maxY; y++) {
        let newRight = '';
        for (let x = maxX + 1; x <= newMaxX; x++) {
            newRight += getChar(x, y);
        }
        const row = container.children[y - minY];
        row.textContent += newRight;
    }
    maxX = newMaxX;
}

function addRowsAbove() {
    const numToAdd = 10;
    const newMinY = minY - numToAdd;
    for (let y = newMinY; y < minY; y++) {
        const row = document.createElement('div');
        row.className = 'row';
        let rowText = '';
        for (let x = minX; x <= maxX; x++) {
            rowText += getChar(x, y);
        }
        row.textContent = rowText;
        container.insertBefore(row, container.firstChild);
    }
    minY = newMinY;
    container.scrollTop += numToAdd * rowHeight; // Keep view stable
}

function addRowsBelow() {
    const numToAdd = 10;
    const newMaxY = maxY + numToAdd;
    for (let y = maxY + 1; y <= newMaxY; y++) {
        const row = document.createElement('div');
        row.className = 'row';
        let rowText = '';
        for (let x = minX; x <= maxX; x++) {
            rowText += getChar(x, y);
        }
        row.textContent = rowText;
        container.appendChild(row);
    }
    maxY = newMaxY;
}
