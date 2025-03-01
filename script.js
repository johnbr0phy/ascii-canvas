// Characters for random ASCII art
const chars = [' ', '.', ':', '-', '=', '+', '*', '#', '%', '@'];

// Function to generate a random string of length n
function randomString(n) {
    return Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
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
const initialNumCols = Math.ceil(viewportWidth / charWidth) + 20; // Extra columns for scrolling
const initialNumRows = Math.ceil(viewportHeight / rowHeight) + 20; // Extra rows for scrolling

// Create initial rows
for (let i = 0; i < initialNumRows; i++) {
    const row = document.createElement('div');
    row.className = 'row';
    row.textContent = randomString(initialNumCols);
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

    if (scrollLeft < threshold) {
        addColumnsToLeft();
    }
    if (scrollTop < threshold) {
        addRowsAbove();
    }
    if (scrollLeft > scrollWidth - clientWidth - threshold) {
        addColumnsToRight();
    }
    if (scrollTop > scrollHeight - clientHeight - threshold) {
        addRowsBelow();
    }
});

// Functions to add content
function addColumnsToLeft() {
    const numColsToAdd = 10;
    const rows = container.querySelectorAll('.row');
    rows.forEach(row => {
        row.textContent = randomString(numColsToAdd) + row.textContent;
    });
    container.scrollLeft += numColsToAdd * charWidth; // Adjust scroll to maintain view
}

function addColumnsToRight() {
    const numColsToAdd = 10;
    const rows = container.querySelectorAll('.row');
    rows.forEach(row => {
        row.textContent += randomString(numColsToAdd);
    });
}

function addRowsAbove() {
    const numRowsToAdd = 10;
    const currentNumCols = container.children[0].textContent.length;
    for (let i = 0; i < numRowsToAdd; i++) {
        const newRow = document.createElement('div');
        newRow.className = 'row';
        newRow.textContent = randomString(currentNumCols);
        container.insertBefore(newRow, container.firstChild);
    }
    container.scrollTop += numRowsToAdd * rowHeight; // Adjust scroll to maintain view
}

function addRowsBelow() {
    const numRowsToAdd = 10;
    const currentNumCols = container.children[0].textContent.length;
    for (let i = 0; i < numRowsToAdd; i++) {
        const newRow = document.createElement('div');
        newRow.className = 'row';
        newRow.textContent = randomString(currentNumCols);
        container.appendChild(newRow);
    }
}
