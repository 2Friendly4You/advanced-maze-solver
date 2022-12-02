// TODO 

// high
// why is generation so slow now

// medium

// low
// show what click will do when hovered (ghost)
// options turn gridlines off

import {Maze} from './maze.js';

const DELAY = 50;

function empty_maze(size) {
    let grid = Array(size).fill().map(() => Array(size).fill(0));
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
    let search_tab_button = document.getElementById("searchTabButton");
    let edit_tab_button = document.getElementById("editTabButton");
    let new_maze_tab_button = document.getElementById("newMazeTabButton");
    let emptyButton = document.getElementById("emptyButton");
    let randomDFSButton = document.getElementById("randomDFSButton");
    let randomPrimsButton = document.getElementById("randomPrimsButton");
    let randomKruskalsButton = document.getElementById("randomKruskalsButton");
    let grid_size_input = document.getElementById("gridSizeInput")
    let breadthButton = document.getElementById("breadthButton");
    let depthButton = document.getElementById("depthButton");
    let a_star_button = document.getElementById("aStarButton");

    let tabs = document.getElementsByClassName("tab");
    let tabButtons = document.getElementsByClassName("tabButton");

    // button events
    const openTab = (clickedTabName, clickedTabButton) => {
        if(clickedTabButton.className.includes("clicked"))
            return;
        for(let tab of tabs)
            tab.style.display = "none";
        document.getElementById(clickedTabName).style.display = "flex";
        for(let tabButton of tabButtons)
            tabButton.className = tabButton.className.replace(" clicked", "");
        clickedTabButton.className += " clicked";
        if(clickedTabButton === edit_tab_button)
            canvas.className += " clickable";
        else
            canvas.className = canvas.className.replace(" clickable", "");
    }
    search_tab_button.addEventListener("click", () => openTab("searchContainer", search_tab_button));
    edit_tab_button.addEventListener("click", () => openTab("editContainer", edit_tab_button));
    new_maze_tab_button.addEventListener("click", () => openTab("newMazeContainer", new_maze_tab_button));

    emptyButton.addEventListener("click", () => {
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
    randomDFSButton.addEventListener("click", () => generate(maze.depth.bind(maze)));
    randomPrimsButton.addEventListener("click", () => generate(maze.prims.bind(maze)));
    randomKruskalsButton.addEventListener("click", () => generate(maze.kruskals.bind(maze)));
    
    breadthButton.addEventListener("click", () => maze.simple_search("breadth", DELAY));
    depthButton.addEventListener("click", () => maze.simple_search("depth", DELAY));
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
        }
    });
    canvas.addEventListener("click", (e) => maze.edit(...mouse_pos(e), checked_radio(), edit_tab_button))
}

function main() {
    init_controls(...init_maze());
}

main();