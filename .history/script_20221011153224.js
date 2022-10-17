// TODO low priority - change drawing so that only changed elements are redrawn

import {MinQueue} from './node_modules/heapify/heapify.mjs'

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
        this.width = this.canvas.width / this.grid.length;
        this.timeoutID = undefined;
    },

    drawAll(visited) {
        for(let r = 0; r < this.grid.length; ++r) {
            for(let c = 0; c < this.grid[0].length; ++c) {
                this.ctx.fillStyle = EMPTY_COLOR;
                this.ctx.strokeStyle = WALL_COLOR;
                this.ctx.lineWidth = .5;
                if(this.grid[r][c] == 1) {
                    this.ctx.fillStyle = WALL_COLOR;
                }
                if(typeof visited !== 'undefined' && visited.has([r, c].toString())) {
                    this.ctx.fillStyle = VISITED_COLOR;
                }
                this.ctx.fillRect(c * this.width, r * this.width, this.width + 1, this.width + 1);
                this.ctx.strokeRect(c * this.width, r * this.width, this.width + 1, this.width + 1);
            }
        }
        this.drawStartAndEnd();
    },

    drawTile(tile, visited) {
        let [r, c] = tile;
        this.ctx.fillStyle = EMPTY_COLOR;
        this.ctx.strokeStyle = WALL_COLOR;
        this.ctx.lineWidth = .5;
        if(this.grid[r][c] == 1) {
            this.ctx.fillStyle = WALL_COLOR;
        }
        if(typeof visited !== 'undefined' && visited.has([r, c].toString())) {
            this.ctx.fillStyle = VISITED_COLOR;
        }
        this.ctx.fillRect(c * this.width, r * this.width, this.width + 1, this.width + 1);
        this.ctx.strokeRect(c * this.width, r * this.width, this.width + 1, this.width + 1);
        if(arrayEquals(this.start, tile) || arrayEquals(this.end, tile)) {
            this.drawStartAndEnd();
        }
    },

    drawStartAndEnd() {
        const drawCircle = (tile, color) => {
            this.ctx.beginPath();
            this.ctx.arc(tile[1] * this.width + this.width / 2, tile[0] * this.width + this.width / 2, this.width / 2.5, 0, Math.PI * 2);
            this.ctx.fillStyle = color;
            this.ctx.fill();
        }
        drawCircle(this.start, START_COLOR, this.width / 2.5);
        drawCircle(this.end, END_COLOR, this.width / 2.5);
    },

    drawPath(path) {
        let middle = .35;
        let edge = (1 - middle) / 2;
        this.ctx.fillStyle = PATH_COLOR;
        let w = this.width;
        for(let i = 0; i < path.length - 1; i++) {
            let curr = path[i];
            let next = path[i + 1];
            let [r, c] = curr;
            let direction = [curr[0] - next[0], curr[1] - next[1]];
            // left
            if(arrayEquals(direction, [0, 1])) {
                this.ctx.fillRect((c - edge) * w, (r + edge) * w, (2 * edge + middle) * w + 1, middle * w + 1);
            };
            // right
            if(arrayEquals(direction, [0, -1])) {
                this.ctx.fillRect((c + edge) * w, (r + edge) * w, (2 * edge + middle) * w + 1, middle * w + 1);
            };
            // down
            if(arrayEquals(direction, [-1, 0])) {
                this.ctx.fillRect((c + edge) * w, (r + edge) * w, middle * w + 1, (2 * edge + middle) * w + 1);
            };
            // up
            if(arrayEquals(direction, [1, 0])) {
                this.ctx.fillRect((c + edge) * w, (r - edge) * w, middle * w + 1, (2 * edge + middle) * w + 1);
            };
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

    async simpleSearch(type, delay) {
        console.assert(type === "depth" || type === "breadth");
        clearTimeout(this.timeoutID);
        this.drawAll();
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
            this.drawTile(curr, visited);
    
            if(arrayEquals(curr, this.end)) {
                this.drawPath(path);
                return path;
            }
            // TODO maybe reverse for depth or breadth
            for(const adj of this.getAdjs(curr)) {
                deque.push([...path, adj]);
            }
            return new Promise((resolve) => this.timeoutID = setTimeout(() => resolve(searchStep(deque, visited, type, delay)), delay));
        }
        return await searchStep(deque, visited, type, delay);
    },

    async aStar(delay) {
        clearTimeout(this.timeoutID);
        const reconstructPath = (prev, tile) => {
            let current = tile;
            let path = [current];
            while(current in prev) {
                current = prev[current]
                path.unshift(current)
            }
            return path
        }

        const taxiCab = (tile) => Math.abs(this.end[0] - tile[0]) + Math.abs(this.end[1] - tile[1]);
        const euclidDist = (tile) => Math.sqrt(Math.pow(this.end[0] - tile[0], 2) + Math.pow(this.end[1] - tile[1], 2));
        const tileToInt = (tile) => tile[0] * this.grid[0].length + tile[1];
        const intToTile = (num) => [Math.floor(num / this.grid[0].length), num % this.grid[0].length]

        let priorityQueue = new MinQueue();
        priorityQueue.push(tileToInt(this.start), 0);

        // TODO: change to actual hashmaps
        let minDistFromStart = {};
        let prev = {};
        let visited = new Set();
        for(let r = 0; r < this.grid.length; r++) {
            for(let c = 0; c < this.grid[0].length; c++) {
                minDistFromStart[[r, c]] = Infinity;
            }
        }
        minDistFromStart[this.start] = 0;
        const searchStep = (delay, visited, priorityQueue, minDistFromStart, prev) => {
            let currDist = priorityQueue.peekPriority();
            let currTile = intToTile(priorityQueue.pop());
            console.log(`currTile: ${currTile} currDist: ${currDist}`);
            if(visited.has(currTile.toString())) {
                return searchStep(delay, visited, priorityQueue, minDistFromStart, prev);
            }
            visited.add(currTile.toString());
            this.drawAll(visited);
            if(arrayEquals(currTile, this.end)) {
                let path = reconstructPath(prev, currTile)
                this.drawPath(path);
                return path;
            }
            for(const adj of this.getAdjs(currTile)) {
                let newMinDistFromStart = minDistFromStart[currTile] + 1;
                if(newMinDistFromStart < minDistFromStart[adj]) {
                    prev[adj] = currTile;
                    minDistFromStart[adj] = newMinDistFromStart;
                    let newEstimatedDist = newMinDistFromStart + taxiCab(adj);
                    // console.log(`taxi cab of ${adj}: ${taxiCab(adj)}`);
                    // console.log(`euclid dist of ${adj}: ${euclidDist(adj)}`);
                    // console.log(`newMinDistFromStart: ${newMinDistFromStart}`);
                    // console.log(`new estimated dist: ${newEstimatedDist}`);
                    console.log(`adding ${adj}`);
                    priorityQueue.push(tileToInt(adj), newEstimatedDist);
                }
            }
            return new Promise((resolve) => this.timeoutID = setTimeout(() => resolve(searchStep(delay, visited, priorityQueue, minDistFromStart, prev)), delay));
        }
        return await searchStep(delay, visited, priorityQueue, minDistFromStart, prev);
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

    async generate(size, delay) {
        clearTimeout(this.timeoutID);
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
            this.drawAll();
            for(const pair of this.getGenerationAdjs(curr)) {
                stack.push(pair);
            }
            return new Promise((resolve) => this.timeoutID = setTimeout(() => resolve(generateStep(stack, visited, delay)), delay));
        }
        return await generateStep(stack, visited, delay);
    },

    click(x, y, mode) {
        let row = Math.floor(y / parseFloat(getComputedStyle(this.canvas).height) * this.grid.length);
        let col = Math.floor(x / parseFloat(getComputedStyle(this.canvas).width) * this.grid.length);
        // console.log(`x: ${x} y: ${y}`);
        // console.log(`row: ${row} col: ${col}`);
        if(mode == 0) {
            this.grid[row][col] = 1;
        }
        else if(mode == 1) {
            this.grid[row][col] = 0;
        }
        else if(mode == 2) {
            this.start = [row, col];
        }
        else if(mode == 3) {
            this.end = [row, col];
        }
        this.drawAll();
    }
}

function generateRandomEvenCoord(size) {
    const generateRandomEvenNumber = (max) => (Math.floor(Math.random() * Math.floor((size + 1) / 2))) * 2;
    let r = generateRandomEvenNumber(size);
    let c = generateRandomEvenNumber(size);
    // console.log(`${r}, ${c}`);
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
    while(arrayEquals(start, end)) {
        end = generateRandomEvenCoord(size);
    }
    return [grid, start, end];
}

function emptyMaze(size) {
    let grid = [];
    for(let r = 0; r < size; r++) {
        let row = [];
        for(let c = 0; c < size; c++) {
            row.push(0);
        }
        grid.push(row);
    }
    let start = [0, 0];
    let end = [size - 1, size - 1];
    return [grid, start, end];
}

function arrayEquals(a, b) {
    return Array.isArray(a) &&
      Array.isArray(b) &&
      a.length === b.length &&
      a.every((val, index) => val === b[index]);
}

function initMaze() {
    let canvas = document.querySelector("canvas");
    let ctx = canvas.getContext("2d");
    let maze = new Maze(canvas, ctx);
    let grid = [
        [0, 0, 0, 0, 1, 0, 0],
        [1, 0, 1, 1, 1, 1, 0],
        [0, 0, 0, 0, 0, 1, 0],
        [0, 1, 1, 1, 0, 1, 0],
        [0, 0, 0, 1, 0, 0, 0],
        [1, 1, 0, 1, 0, 1, 0],
        [0, 0, 0, 0, 0, 1, 0],
    ];
    let grid2 = [
        [0, 0, 0, 0, 0, 1, 0, 0],
        [0, 0, 0, 0, 0, 1, 0, 0],
        [0, 0, 0, 0, 0, 1, 0, 0],
        [0, 0, 0, 0, 0, 1, 0, 0],
        [0, 0, 0, 0, 0, 1, 0, 0],
        [0, 0, 0, 0, 0, 1, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0]
    ]
    let start = [0, 0];
    let end = [7, 7];
    maze.setProperties(grid2, start, end);
    maze.drawAll();
    return [canvas, maze];
}

function initControls(canvas, maze) {
    let emptyButton = document.getElementById("emptyButton")
    let generateButton = document.getElementById("generateButton");
    let generateInput = document.getElementById("generateInput")
    let breadthButton = document.getElementById("breadthButton");
    let depthButton = document.getElementById("depthButton");
    let aStarButton = document.getElementById("aStarButton");

    // button events
    emptyButton.addEventListener("click", () => {
        maze.setProperties(...emptyMaze(Number(generateInput.value), 50));
        maze.drawAll();
    })
    generateButton.addEventListener("click", () => maze.generate(Number(generateInput.value), 50));
    breadthButton.addEventListener("click", () => maze.simpleSearch("breadth", 50));
    depthButton.addEventListener("click", () => maze.simpleSearch("depth", 50));
    aStarButton.addEventListener("click", () => maze.aStar(50));

    // mouse events
    let mouseDown = false;
    canvas.addEventListener("mousedown", () => mouseDown = true);
    document.addEventListener("mouseup", () => mouseDown = false);
    const getMousePos = (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        return [x, y];
    }
    const getCheckedRadio = () => {
        return Number(document.querySelector('input[name="tileSelector"]:checked').value)
    }
    canvas.addEventListener("mousemove", (e) => {
        if(mouseDown) {
            getCheckedRadio();
            maze.click(...getMousePos(e), getCheckedRadio());
        }
    });
    canvas.addEventListener("click", (e) => maze.click(...getMousePos(e), getCheckedRadio()))
}

function main() {
    initControls(...initMaze());
    // testMinQueue();
}

function testMinQueue() {
    let heap = new MinQueue(100);
    let n = 100;
    for(let i = 1; i < n; i++) {
        heap.push(i, 1);
    }
    while(heap.size != 0) {
        console.log(heap.pop());
    }
}

main();