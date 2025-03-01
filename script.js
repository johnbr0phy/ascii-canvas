// Define cell dimensions
const cellWidth = 20; // characters
const cellHeight = 10; // rows

// Hash function to create consistent randomness based on coordinates
function hash(x, y) {
    let n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return n - Math.floor(n);
}

// Generate a face with random features
function generateFace(x, y) {
    const eyesIndex = Math.floor(hash(x + 1, y) * 5);
    const eyes = ['o', 'O', '*', '0', '^'][eyesIndex];
    const noseIndex = Math.floor(hash(x + 2, y) * 4);
    const nose = ['|', '-', '~', ''][noseIndex];
    const mouthIndex = Math.floor(hash(x + 3, y) * 4);
    const mouth = ['___', '---', '~~~', '==='][mouthIndex];
    return [
        "                    ",
        "                    ",
        "                    ",
        "      .--.          ",
        `     / ${eyes} ${eyes} \\        `,
        `     |   ${nose}   |        `,
        `     \\  ${mouth}  /        `,
        "      '--'          ",
        "                    ",
        "                    "
    ].map(line => line.padEnd(cellWidth, ' '));
}

// Generate a flower with random petals and center
function generateFlower(x, y) {
    const petalIndex = Math.floor(hash(x + 1, y) * 4);
    const petal = ['*', '+', 'x', 'o'][petalIndex];
    const centerIndex = Math.floor(hash(x + 2, y) * 3);
    const center = ['o', '*', '+'][centerIndex];
    return [
        "                    ",
        "                    ",
        `         ${petal}         `,
        `        ${petal} ${petal}        `,
        `       ${petal} ${center} ${petal}       `,
        `        ${petal} ${petal}        `,
        `         ${petal}         `,
        "                    ",
        "                    ",
        "                    "
    ].map(line => line.padEnd(cellWidth, ' '));
}

// Generate an object (a house in this case)
function generateObject(x, y) {
    return [
        "                    ",
        "         /\\         ",
        "        /  \\        ",
        "       /____\\       ",
        "       |    |       ",
        "       | [] |       ",
        "       |____|       ",
        "                    ",
        "                    ",
        "                    "
    ].map(line => line.padEnd(cellWidth, ' '));
}

// Decide which template to use for a cell
function getTemplate(x, y) {
    const typeSeed = hash(x, y);
    if (typeSeed < 0.33) {
        return generateFace(x, y);
    } else if (typeSeed < 0.66) {
        return generateFlower(x, y);
    } else {
        return generateObject(x, y);
    }
}

const container = document.getElementById('container');

// Measure character width and row height
const tempSpan = document.createElement('span');
tempSpan.style.fontFamily = 'monospace';
tempSpan.style.fontSize = '16px';
tempSpan.style.position = 'absolute';
tempSpan.style.visibility = 'hidden';
tempSpan.textContent = 'a';
document.body.appendChild(tempSpan);
const charWidth = tempSpan.getBoundingClientRect().width;
document.body.removeChild(tempSpan);

const tempRow = document.createElement('div');
tempRow.className = 'row';
tempRow.textContent = 'a';
container.appendChild(tempRow);
const rowHeight = tempRow.getBoundingClientRect().height;
container.removeChild(tempRow);

// Calculate initial number of cells to cover the viewport plus a buffer
const viewportWidth = container.clientWidth;
const viewportHeight = container.clientHeight;
const cellPixelWidth = cellWidth * charWidth;
const cellPixelHeight = cellHeight * rowHeight;
const initialCellXCount = Math.ceil(viewportWidth / cellPixelWidth) + 2;
const initialCellYCount = Math.ceil(viewportHeight / cellPixelHeight) + 2;

// Set initial bounds of generated cells
let cellXMin = 0;
let cellXMax = initialCellXCount - 1;
let cellYMin = 0;
let cellYMax = initialCellYCount - 1;

// Generate initial rows
for (let r = 0; r < (cellYMax - cellYMin + 1) * cellHeight; r++) {
    const cellY = Math.floor(r / cellHeight) + cellYMin;
    const lineIndex = r % cellHeight;
    let rowText = '';
    for (let cellX = cellXMin; cellX <= cellXMax; cellX++) {
        const template = getTemplate(cellX, cellY);
        rowText += template[lineIndex];
    }
    const row = document.createElement('div');
    row.className = 'row';
    row.textContent = rowText;
    container.appendChild(row);
}

// Handle scrolling to add new content
container.addEventListener('scroll', () => {
    const scrollLeft = container.scrollLeft;
    const scrollTop = container.scrollTop;
    const scrollWidth = container.scrollWidth;
    const scrollHeight = container.scrollHeight;
    const clientWidth = container.clientWidth;
    const clientHeight = container.clientHeight;
    const threshold = 200; // Distance from edge to trigger new content

    if (scrollLeft < threshold) addCellLeft();
    if (scrollTop < threshold) addCellAbove();
    if (scrollLeft > scrollWidth - clientWidth - threshold) addCellRight();
    if (scrollTop > scrollHeight - clientHeight - threshold) addCellBelow();
});

// Add a new column of cells to the left
function addCellLeft() {
    const newCellXMin = cellXMin - 1;
    for (let r = 0; r < container.children.length; r++) {
        const cellY = Math.floor(r / cellHeight) + cellYMin;
        const lineIndex = r % cellHeight;
        const template = getTemplate(newCellXMin, cellY);
        container.children[r].textContent = template[lineIndex] + container.children[r].textContent;
    }
    cellXMin = newCellXMin;
    container.scrollLeft += cellWidth * charWidth;
}

// Add a new column of cells to the right
function addCellRight() {
    const newCellXMax = cellXMax + 1;
    for (let r = 0; r < container.children.length; r++) {
        const cellY = Math.floor(r / cellHeight) + cellYMin;
        const lineIndex = r % cellHeight;
        const template = getTemplate(newCellXMax, cellY);
        container.children[r].textContent += template[lineIndex];
    }
    cellXMax = newCellXMax;
}

// Add a new row of cells above
function addCellAbove() {
    const newCellYMin = cellYMin - 1;
    const firstChild = container.firstChild;
    for (let i = 0; i < cellHeight; i++) {
        let rowText = '';
        for (let cellX = cellXMin; cellX <= cellXMax; cellX++) {
            const template = getTemplate(cellX, newCellYMin);
            rowText += template[i];
        }
        const newRow = document.createElement('div');
        newRow.className = 'row';
        newRow.textContent = rowText;
        container.insertBefore(newRow, firstChild);
    }
    cellYMin = newCellYMin;
    container.scrollTop += cellHeight * rowHeight;
}

// Add a new row of cells below
function addCellBelow() {
    const newCellYMax = cellYMax + 1;
    for (let i = 0; i < cellHeight; i++) {
        let rowText = '';
        for (let cellX = cellXMin; cellX <= cellXMax; cellX++) {
            const template = getTemplate(cellX, newCellYMax);
            rowText += template[i];
        }
        const newRow = document.createElement('div');
        newRow.className = 'row';
        newRow.textContent = rowText;
        container.appendChild(newRow);
    }
    cellYMax = newCellYMax;
}
