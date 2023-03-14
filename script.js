// TODO 

// high
// change start of search to only draw_all if visited is not empty, use existing function inside edit 

// medium
// general performance, check everything is fast

// low
// show what click will do when hovered (ghost)
// options turn gridlines off

import {Maze, square_array} from './maze.js';

const DELAY = 50;

function empty_maze(size) {
    let grid = square_array(size, false);
    let start = [0, 0];
    let end = [size - 1, size - 1];
    return [grid, start, end];
}

function init_maze() {
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
    let start = [0, 0];
    let end = [0, 5];
    maze.set_properties(grid, start, end);
    maze.draw_all();
    maze.set_properties(grid, start, end);
    maze.draw_all();
    return [canvas, maze];
}

function valid_grid_size(input) {
    let num = Number(input.value);
    if(Number.isInteger(num) && num >= 3) {
        input.style.backgroundColor = "white";
        return true;
    }
    else {
        input.style.backgroundColor = "red";
        alert("Value in text input must be a positive integer greater than or equal to 3")
        return false;
    }
}

function init_controls(canvas, maze) {
    let search_tab_button = document.getElementById("search_tab_button");
    let edit_tab_button = document.getElementById("edit_tab_button");
    let new_maze_tab_button = document.getElementById("new_maze_tab_button");

    let empty_button = document.getElementById("empty_button");
    let random_dfs_button = document.getElementById("random_dfs_button");
    let prims_button = document.getElementById("prims_button");
    let kruskals_button = document.getElementById("kruskals_button");
    let grid_size_input = document.getElementById("grid_size_input")
    let breadth_button = document.getElementById("breadthButton");
    let depth_button = document.getElementById("depthButton");
    let a_star_button = document.getElementById("aStarButton");

    let tabs = document.getElementsByClassName("tab_content");
    let tab_buttons = document.getElementsByClassName("tab_button");

    // button events
    const open_tab = (clicked_tab_name, clicked_tab_button) => {
        if(clicked_tab_button.className.includes("clicked"))
            return;
        for(let tab of tabs)
        for(let tab of tabs)
            tab.style.display = "none";
        document.getElementById(clicked_tab_name).style.display = "flex";
        for(let tabButton of tab_buttons)
            tabButton.className = tabButton.className.replace(" clicked", "");
        clicked_tab_button.className += " clicked";
        if(clicked_tab_button === edit_tab_button)
            canvas.style.cursor = "pointer";
        else
            canvas.style.cursor = "default";
    }
    search_tab_button.addEventListener("click", () => open_tab("search_tab", search_tab_button));
    edit_tab_button.addEventListener("click", () => open_tab("edit_tab", edit_tab_button));
    new_maze_tab_button.addEventListener("click", () => open_tab("new_maze_tab", new_maze_tab_button));

    empty_button.addEventListener("click", () => {
        if(valid_grid_size(grid_size_input)) {
            maze.clear_timeout();
            maze.set_properties(...empty_maze(Number(grid_size_input.value)));
            maze.draw_all();
        }
    });
    const generate = (func) => {
        if(valid_grid_size(grid_size_input)) {
            maze.clear_timeout();
            func(Number(grid_size_input.value), DELAY);
        }
    }
    random_dfs_button.addEventListener("click", () => generate(maze.depth.bind(maze)));
    prims_button.addEventListener("click", () => generate(maze.prims.bind(maze)));
    kruskals_button.addEventListener("click", () => generate(maze.kruskals.bind(maze)));
    
    breadth_button.addEventListener("click", () => maze.simple_search("breadth", DELAY));
    depth_button.addEventListener("click", () => maze.simple_search("depth", DELAY));
    a_star_button.addEventListener("click", () => maze.a_star(DELAY));

    // mouse events
    let mouseDown = false;
    canvas.addEventListener("mousedown", () => mouseDown = true);
    document.addEventListener("mouseup", () => mouseDown = false);
    const mouse_pos = (e) => {
        const rect = canvas.getBoundingClientRect();
        return [e.clientX - rect.left,  e.clientY - rect.top];
    }
    const checked_radio = () => {
        return Number(document.querySelector('input[name="tileSelector"]:checked').value);
    }
    canvas.addEventListener("mousemove", (e) => {
        if(mouseDown) {
            maze.edit(...mouse_pos(e), checked_radio(), edit_tab_button);
            maze.edit(...mouse_pos(e), checked_radio(), edit_tab_button);
        }
    });
    canvas.addEventListener("click", (e) => maze.edit(...mouse_pos(e), checked_radio(), edit_tab_button))
}

function main() {
    init_controls(...init_maze());
}

main();
