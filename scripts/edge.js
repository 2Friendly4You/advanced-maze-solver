export class Edge {
    constructor(from, to) {
        this.from = from;
        this.to = to;
    }
    get_middle() {
        return [Math.floor((this.from[0] + this.to[0]) / 2), Math.floor((this.from[1] + this.to[1]) / 2)];
    }
}

