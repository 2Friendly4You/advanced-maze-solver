import {Edge} from './edge.js';
import {DisjointSet} from './disjoint_set.js';

const EMPTY_COLOR = "#D6D5A8";
const WALL_COLOR = "#1B2430";
const VISITED_COLOR = "#808080";
const PATH_COLOR = "#FF2E63";
const START_COLOR = "#F08A5D";
const END_COLOR = "#4E9F3D";

export class Maze {
    
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
    }

    set_properties(grid, start, end) {
        this.grid = grid;
        this.size = this.grid.length;
        this.start = start;
        this.end = end;
        this.width = this.canvas.width / this.grid.length;
        this.visited = Array(this.size).fill().map(() => Array(this.size).fill(false));
        this.timeoutID = undefined;
    }

    async clear_timeout() {
        clearTimeout(this.timeoutID);
    }

    clear_visited() {
        this.visited = Array(this.size).fill().map(() => Array(this.size).fill(false));
    }

    draw_all() {
        for (let r = 0; r < this.size; ++r) {
            for (let c = 0; c < this.size; ++c) {
                this.draw_tile([r, c]);
            }
        }
    }

    draw_circle(tile, color) {
        this.ctx.beginPath();
        this.ctx.arc(tile[1] * this.width + this.width / 2, tile[0] * this.width + this.width / 2, this.width / 2.5, 0, Math.PI * 2);
        this.ctx.fillStyle = color;
        this.ctx.fill();
    }

    draw_tile(tile) {
        let [r, c] = tile;
        this.ctx.fillStyle = EMPTY_COLOR;
        this.ctx.strokeStyle = WALL_COLOR;
        this.ctx.lineWidth = .5;
        if(this.grid[r][c] == 1)
            this.ctx.fillStyle = WALL_COLOR;
        else if(this.visited[r][c])
            this.ctx.fillStyle = VISITED_COLOR;
        this.ctx.fillRect(c * this.width, r * this.width, this.width, this.width);
        this.ctx.strokeRect(c * this.width, r * this.width, this.width, this.width);
        if(array_equals(tile, this.start))
            this.draw_circle(this.start, START_COLOR);
        if(array_equals(tile, this.end))
            this.draw_circle(this.end, END_COLOR);
    }

    draw_path(path) {
        let middle = .35;
        let edge = (1 - middle) / 2;
        let w = this.width;
        this.ctx.fillStyle = PATH_COLOR;
        for(let i = 0; i < path.length - 1; i++) {
            let curr = path[i];
            let next = path[i + 1];
            let [r, c] = curr;
            let direction = [next[0] - curr[0], next[1] - curr[1]];
            // left and right
            if(direction[0] === 0)
                this.ctx.fillRect((c + direction[1] * edge) * w, (r + edge) * w, (2 * edge + middle) * w + 1, middle * w + 1);
            // up and down
            if(direction[1] == 0)
                this.ctx.fillRect((c + edge) * w, (r + direction[0] * edge) * w, middle * w + 1, (2 * edge + middle) * w + 1);
        }
        this.draw_circle(this.start, START_COLOR);
        this.draw_circle(this.end, END_COLOR);
    }

    check_movable(curr) {
        let [r, c] = curr;
        return 0 <= r && r < this.size &&
            0 <= c && c < this.size &&
            this.grid[r][c] == 0;
    }

//  maze searching

    get_adjs(tile) {
        let [r, c] = tile;
        let poss_adjs = [[r - 1, c], [r, c + 1], [r + 1, c], [r, c - 1]];
        return poss_adjs.filter((poss_adj) => this.check_movable(poss_adj));
    }

    async simple_search(type, delay) {
        console.assert(type === "depth" || type === "breadth");
        this.clear_timeout();
        this.visited = square_array(this.size, false);
        this.draw_all();
        let deque = [[this.start]];
        const step = () => {
            if(deque.length == 0)
                return;
            let path;
            if(type === "depth")
                path = deque.pop();
            else
                path = deque.shift();
            let curr = path[path.length - 1];
            let [r, c] = curr;
            if(this.visited[r][c])
                return step();
            this.visited[r][c] = true;
            this.draw_tile(curr);
            if(array_equals(curr, this.end)) {
                this.draw_path(path);
                return path;
            }
            // TODO maybe reverse for depth or breadth
            for(const adj of this.get_adjs(curr)) {
                deque.push([...path, adj]);
            }
            return new Promise((resolve) => this.timeoutID = setTimeout(() => resolve(step()), delay));
        };
        return await step();
    }

    async a_star(delay) {
        this.clear_timeout();
        this.visited = square_array(this.size, false);
        this.draw_all();
        const reconstruct_path = (prev, tile) => {
            let current = tile;
            let path = [current];
            while(current in prev) {
                current = prev[current];
                path.unshift(current);
            }
            return path;
        };
        const taxi_cab = (tile) => Math.abs(this.end[0] - tile[0]) + Math.abs(this.end[1] - tile[1]);
        let pq = [[0, this.start]];
        let dist = {};
        let prev = {};
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                dist[[r, c]] = Infinity;
            }
        }
        dist[this.start] = 0;
        const step = () => {
            if (pq.length === 0) {
                return;
            }
            pq = pq.sort((a, b) => a[0] - b[0]);
            let [curr_dist, curr_tile] = pq[0];
            let [r, c] = curr_tile;
            pq.splice(0, 1);
            // console.log(`currTile: ${currTile} currDist: ${currDist}`);
            if(this.visited[r][c]) {
                return step();
            }
            this.visited[r][c] = true;
            this.draw_tile(curr_tile);
            if (array_equals(curr_tile, this.end)) {
                let path = reconstruct_path(prev, curr_tile);
                this.draw_path(path);
                return path;
            }
            for (const adj of this.get_adjs(curr_tile)) {
                let new_dist = dist[curr_tile] + 1;
                if (new_dist < dist[adj]) {
                    dist[adj] = new_dist;
                    prev[adj] = curr_tile;
                    let new_estimated_dist = new_dist + taxi_cab(adj);
                    pq.unshift([new_estimated_dist, adj]);
                }
            }
            return new Promise((resolve) => this.timeoutID = setTimeout(() => resolve(step()), delay));
        };
        return await step();
    }

    // maze generation

    get_generation_adjs(curr) {
        let [r, c] = curr;
        let edges = [
            new Edge(curr, [r - 2, c]),
            new Edge(curr, [r, c + 2]),
            new Edge(curr, [r + 2, c]),
            new Edge(curr, [r, c - 2]),
        ];
        edges = edges.filter((edge) => this.check_movable(edge.to));
        return edges;
    }

    async depth(size, delay) {
        this.clear_timeout();
        this.set_properties(...prepare_maze(size));
        this.draw_all();
        let gen_start = random_even_coord(size);
        let stack = [new Edge(gen_start, gen_start)];
        let added = square_array(this.size, false);
        const shuffle = (arr) => {
            return arr
                .map(val => ({val, sort: Math.random()}))
                .sort((a, b) => a.sort - b.sort)
                .map(({val}) => val);
        };
        const step = () => {
            if(stack.length === 0)
                return;
            let edge = stack.pop();
            if(added[edge.to[0]][edge.to[1]])
                return step();
            added[edge.to[0]][edge.to[1]] = true;
            let wall = edge.get_middle();
            this.grid[wall[0]][wall[1]] = 0;
            stack.push(...shuffle(this.get_generation_adjs(edge.to)));
            this.draw_tile(wall);
            return new Promise((resolve) => this.timeoutID = setTimeout(() => resolve(step()), delay));
        };
        return await step();
    }

    async prims(size, delay) {
        this.clear_timeout();
        this.set_properties(...prepare_maze(size));
        this.draw_all();
        let gen_start = random_even_coord(size);
        let edges = [new Edge(gen_start, gen_start)];
        let added = square_array(this.size, false);
        const step = () => {
            if(edges.length === 0)
                return
            let ind = Math.floor(Math.random() * edges.length);
            let edge = edges[ind];
            edges.splice(ind, 1);
            if(added[edge.to[0]][edge.to[1]])
                return step(edges, added, delay);
            added[edge.to[0]][edge.to[1]] = true;
            let wall = edge.get_middle();
            this.grid[wall[0]][wall[1]] = 0;
            edges.push(...this.get_generation_adjs(edge.to));
            this.draw_tile(wall);
            return new Promise((resolve) => this.timeoutID = setTimeout(() => resolve(step(edges, added, delay)), delay));
        };
        return await step(edges, added, delay);
    }

    async kruskals(size, delay) {
        this.clear_timeout();
        this.set_properties(...prepare_maze(size));
        this.draw_all();
        const tile_to_int = (tile) => tile[0] * size + tile[1];
        const all_edges = (size) => {
            let edges = [];
            for(let r = 0; r < size; r += 2) {
                for(let c = 0; c < size; c += 2) {
                    if(r + 2 < size) {
                        edges.push(new Edge([r, c], [r + 2, c]));
                    }
                    if(c + 2 < size) {
                        edges.push(new Edge([r, c], [r, c + 2]));
                    }
                }
            }
            return edges;
        }
        let edges = all_edges(size);
        let ds = new DisjointSet(size * size);
        const step = () => {
            if(edges.length === 0)
                return;
            let ind = Math.floor(Math.random() * edges.length);
            let edge = edges[ind];
            edges.splice(ind, 1);
            if(ds.find(tile_to_int(edge.from)) === ds.find(tile_to_int(edge.to))) {
                return step();
            }
            ds.merge(tile_to_int(edge.from), tile_to_int(edge.to));
            let wall = edge.get_middle();
            this.grid[wall[0]][wall[1]] = 0;
            this.draw_tile(wall);
            return new Promise((resolve) => this.timeoutID = setTimeout(() => resolve(step()), delay));
        };
        return await step();
    }

    edit(x, y, mode, edit_tab_button) {
        if(!edit_tab_button.className.includes("clicked"))
            return;
        let r = Math.floor(y / parseFloat(getComputedStyle(this.canvas).height) * this.size);
        let c = Math.floor(x / parseFloat(getComputedStyle(this.canvas).width) * this.size);
        const clear_visited = () => {
            if(this.visited.some((row) => row.includes(true))) {
                this.visited = square_array(this.size, false);
                this.draw_all();
            }
        }
        const update_tiles = (tiles) => {
            this.clear_timeout();
            clear_visited();
            for(const tile of tiles) {
                this.draw_tile(tile);
            }
        }
        if(mode === 0 && this.grid[r][c] != 1) {
            this.grid[r][c] = 1;
            update_tiles([[r, c]]);
        }
        else if (mode === 1 && this.grid[r][c] != 0) {
            this.grid[r][c] = 0;
            update_tiles([[r, c]]);
        }
        else if(mode === 2 && this.grid[r][c] == 0) {
            const old_start = this.start;
            this.start = [r, c];
            update_tiles([[r, c], old_start]);
        }
        else if(mode === 3 && this.grid[r][c] == 0) {
            let old_end = this.end;
            this.end = [r, c];
            update_tiles([[r, c], old_end]);
        }
    }
}

function random_even_coord(size) {
    const random_even_number = () => Math.floor(Math.random() * Math.floor((size + 1) / 2)) * 2;
    let r = random_even_number();
    let c = random_even_number();
    return [r, c];
}

function prepare_maze(size) {
    if(size % 2 != 1)
        size -= 1;
    let grid = Array(size).fill().map(() => Array(size).fill(1));
    for(let r = 0; r < size; r += 2) {
        for(let c = 0; c < size; c += 2) {
            grid[r][c] = 0;
        }
    }
    let start = random_even_coord(size);
    let end = random_even_coord(size);
    while(array_equals(start, end)) {
        end = random_even_coord(size);
    }
    return [grid, start, end];
}

function array_equals(a, b) {
    return Array.isArray(a) &&
        Array.isArray(b) &&
        a.length === b.length &&
        a.every((val, ind) => val === b[ind]);
}

export function square_array(size, val) {
    return Array(size).fill().map(() => Array(size).fill(val));
}