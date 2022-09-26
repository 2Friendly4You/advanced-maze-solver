import {MinQueue} from './node_modules/heapify/heapify.mjs'
// TODO low priority - change drawing so that only changed elements are redrawn
const EMPTY_COLOR = "#D6D5A8";
const WALL_COLOR = "#1B2430";
const VISITED_COLOR = "gray";
const PATH_COLOR = "#FF2E63"
const START_COLOR = "#F08A5D"
const END_COLOR = "#4E9F3D"

function Maze(canvas, ctx) {
    this.canvas = canvas
    this.ctx = ctx;
}

Maze.prototype = {

    setProperties(grid, start, end) {
        this.grid = grid;
        this.start = start;
        this.end = end;
        this.width = this.canvas.width / this.grid[0].length;
        this.height = this.canvas.height / this.grid.length;
    },

    draw(visited) {
        for(let r = 0; r < this.grid.length; ++r) {
            for(let c = 0; c < this.grid[0].length; ++c) {
                this.ctx.beginPath();
                this.ctx.fillStyle = EMPTY_COLOR;
                if(this.grid[r][c] == 1) {
                    this.ctx.fillStyle = WALL_COLOR;
                }
                if(typeof visited !== 'undefined' && visited.has([r, c].toString())) {
                    this.ctx.fillStyle = VISITED_COLOR;
                }
                this.ctx.fillRect(c * this.width, r * this.height, this.width, this.height);
            }
        }
        this.drawStartAndEnd();
    },

    drawStartAndEnd() {
        const drawCircle = (tile, color) => {
            this.ctx.beginPath();
            this.ctx.arc(tile[1] * this.width + this.width / 2, tile[0] * this.height + this.height / 2, this.width / 2.5, 0, Math.PI * 2);
            this.ctx.fillStyle = color;
            this.ctx.fill();
        }
        drawCircle(this.start, START_COLOR);
        drawCircle(this.end, END_COLOR);
    },

    drawPath(path) {
        for(const tile of path) {
            let [r, c] = tile;
            this.ctx.fillStyle = PATH_COLOR;
            this.ctx.fillRect(c * this.width, r * this.height, this.width, this.height);
        }
        this.drawStartAndEnd();
    },

    checkMovable(curr) {
        let [r, c] = curr;
        return 0 <= r && r < this.grid.length &&
               0 <= c && c < this.grid[0].length &&
               this.grid[r][c] == 0;
    },

    getAdjs(tile) {
        let [r, c] = tile;
        let possAdjs = [[r - 1, c], [r, c + 1], [r + 1, c], [r, c - 1]];
        return possAdjs.filter((possAdj) => this.checkMovable(possAdj));
    },

    getGenerationAdjs(curr) {
        let [r, c] = curr;
        let possPairs = [
            [[r - 1, c], [r - 2, c]],
            [[r, c + 1], [r, c + 2]], 
            [[r + 1, c], [r + 2, c]],
            [[r, c - 1], [r, c - 2]]
        ];
        possPairs = possPairs.filter((possPair) => this.checkMovable(possPair[1]))

        const shuffle = (arr) => {
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
        }
        shuffle(possPairs);
        return possPairs;
    },

    simpleSearch(type, delay) {
        console.assert(type === "depth" || type === "breadth");
        let deque = [[this.start]];
        let visited = new Set();
        const searchStep = (deque, visited, type, delay) => {
            if(deque.length == 0) {
                return;
            }
            let path;
            if(type === "depth") {
                path = deque.pop();
            }
            else {
                path = deque.shift();
            }
            let curr = path[path.length - 1];
            if(visited.has(curr.toString())) {
                return searchStep(deque, visited, type, delay);
            }
            visited.add(curr.toString());
            this.draw(visited);
    
            if(arrayEquals(curr, this.end)) {
                this.drawPath(path);
                return path;
            }
            //TODO maybe reverse for depth or breadth
            for(const adj of this.getAdjs(curr)) {
                deque.push([...path, adj]);
            }
            setTimeout(() => searchStep(deque, visited, type, delay), delay);
        }
        searchStep(deque, visited, type, delay);
    },

    aStar(delay) {
        const reconstructPath = (prev, tile) => {
            
            let current = tile;
            // while(current)
        }

        const taxiCab = (tile) => abs(this.end[0] - tile[0]) + abs(this.end[1] - tile[1])

        let priorityQueue = new MinQueue();
        priorityQueue.push(this.start, 0);


        // TODO: change to actual hashmaps
        let prev = {}
        let minDistFromStart = {}
        let estimatedDistToEnd = {}
        for(let r = 0; r < this.grid.size; r++) {
            for(let c = 0; c < this.grid.size[0]; c++) {
                minDistFromStart[[r, c]] = Infinity;
                estimatedDistToEnd[[r, c]] = Infinity;
            }
        }
        minDistFromStart[this.start] = 0
        minDistFromStart[this.start] = taxiCab(this.start)
        const searchStep = () => {
            let currDist = priorityQueue.peekPriority();
            let currTile = priorityQueue.pop();
            if(arrayEquals(currTile, this.end)) {
                return reconstructPath(prev, currTile)
            }
            for(const adj of this.getAdjs()) {
                
            }
        }
        searchStep(delay)
    },

    generate(size, delay) {
        this.setProperties(...prepareMaze(size));
        let genStart = generateRandomEvenCoord(this.grid.length);
        let stack = [[genStart, genStart]];
        let visited = new Set();
        const generateStep = (stack, visited, delay) => {
            if(stack.length == 0) {
                return "Done generating"; 
            }
            let [wall, curr] = stack.pop();
            if(visited.has(curr.toString())) {
                return generateStep(stack, visited, delay);;
            }
            // console.log(`visiting ${curr}`)
            visited.add(curr.toString());
            this.grid[wall[0]][wall[1]] = 0;
            this.draw();
            for(const pair of this.getGenerationAdjs(curr)) {
                stack.push(pair);
            }
            setTimeout(() => generateStep(stack, visited, delay), delay)
        }
        return generateStep(stack, visited, delay);
    },

    click(x, y) {
        // canvasSize = this.canvas.style.width;
        // console.log(`width: ${this.width} height:  ${this.height}`)
        console.log("x: " + x + " y: " + y);

        let row = Math.floor(y / parseFloat(getComputedStyle(this.canvas).height) * this.grid.length);
        let col = Math.floor(x / parseFloat(getComputedStyle(this.canvas).width) * this.grid.length);
        console.log(`row: ${row} col: ${col}`);

        this.grid[row][col] = 1;
        this.draw();
    }
}

function generateRandomEvenCoord(size) {
    const generateRandomEvenNumber = (max) => Math.floor(Math.random() * Math.floor(size/2)) * 2;
    let r = generateRandomEvenNumber(size);
    let c = generateRandomEvenNumber(size);
    return [r, c];
}

function prepareMaze(size) {
    console.assert(size % 2 === 1);
    let grid = [];
    for(let r = 0; r < size; r++) {
        let row = [];
        for(let c = 0; c < size; c++) {
            if(r % 2 === 0 && c % 2 === 0) {
                row.push(0);
            }
            else {
                row.push(1);
            }
        }
        grid.push(row);
    }
    let start = generateRandomEvenCoord(size);
    let end = generateRandomEvenCoord(size);
    return [grid, start, end];
}

function arrayEquals(a, b) {
    return Array.isArray(a) &&
      Array.isArray(b) &&
      a.length === b.length &&
      a.every((val, index) => val === b[index]);
}

function arrayContainsSubarray(bigArr, smallArr) {
    return bigArr.some((subarr) => (arrayEquals(smallArr, subarr)))
}

function main() {
    let canvas = document.querySelector("canvas");
    let ctx = canvas.getContext("2d");

    let generateButton = document.getElementById("generateButton");
    let breadthButton = document.getElementById("breadthButton");
    let depthButton = document.getElementById("depthButton");
    let generateInput = document.getElementById("generateInput")

    let size = 25;
    // let [grid, start, end] = prepareMaze(size);
    
    let maze = new Maze(canvas, ctx);
    let grid = [
        [0, 0, 0, 0, 1, 0, 0],
        [1, 0, 1, 1, 1, 1, 0],
        [0, 0, 1, 0, 0, 1, 0],
        [0, 1, 1, 1, 0, 1, 0],
        [0, 0, 0, 1, 0, 0, 0],
        [1, 1, 0, 1, 0, 1, 0],
        [0, 0, 0, 0, 0, 1, 0],
    ];
    let start = [0, 0];
    let end = [6, 6];
    maze.setProperties(grid, start, end);
    maze.draw();

    breadthButton.addEventListener("click", () => maze.simpleSearch("breadth", 50));
    depthButton.addEventListener("click", () => maze.simpleSearch("depth", 50));
    generateButton.addEventListener("click", () => {
        maze.generate(Number(generateInput.value), 50)
    });
    

    // let mouseDown = false;
    // document.addEventListener("mousedown", () => mouseDown = true);
    // document.addEventListener("mouseup", () => mouseDown = false);
    canvas.addEventListener("mousedown", (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        maze.click(x, y);
    });
}

// main();
let map = {};
map[0] = "zero"
console.log(0 in )