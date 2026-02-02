let selected = [];
let solvedLabels = new Set();

const COLOR_MAP = {
    yellow: "#F9DF6D",
    green: "#A0C35A",
    blue: "#5DA9E9",
    purple: "#B07ACF"
};

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function updateGridState() {
    const grid = document.getElementById("grid");
    grid.classList.toggle("max-selected", selected.length === 4);
}

function shuffleGrid() {
    const grid = document.getElementById("grid");

    const tiles = Array.from(grid.children);

    selected.forEach(s => s.div.classList.remove("selected"));
    selected = [];
    updateGridState();

    shuffle(tiles);

    tiles.forEach(tile => grid.appendChild(tile));
}


fetch("js/groups.json")
    .then(res => res.json())
    .then(data => {
        const puzzles = data.groups;
        const randomIndex = Math.floor(Math.random() * puzzles.length);
        init(puzzles[randomIndex]);
    });


function init(puzzle) {
    const grid = document.getElementById("grid");

    const words = shuffle([...puzzle.words]);

    words.forEach(word => {
        const div = document.createElement("div");
        div.className = "word";
        div.textContent = word;

        div.onclick = () => toggle(div, word);
        grid.appendChild(div);
    });

    document.getElementById("submit").onclick = () =>
    checkSelection(puzzle.solutions);

    document.getElementById("shuffle").onclick = shuffleGrid;
}


function toggle(div, word) {
    if (div.classList.contains("solved")) return;

    const alreadySelected = div.classList.contains("selected");

    if (!alreadySelected && selected.length === 4) return;

    div.classList.toggle("selected");

    if (div.classList.contains("selected")) {
        selected.push({ div, word });
    } else {
        selected = selected.filter(s => s.div !== div);
    }

    updateGridState();
}

function checkSelection(solutions) {

    if (selected.length !== 4) {
    alert("Select exactly 4 words");
    return;
    }

    const words = selected.map(s => s.word);

    const solution = solutions.find(sol => sol.words.every(w => words.includes(w)));

    if (solution && !solvedLabels.has(solution.label)) {
        const bg = COLOR_MAP[solution.color];
        selected.forEach(s => s.div.remove());

        const solved = document.createElement("div");
        solved.className = "solved-group";
        solved.style.background = bg;

        solved.innerHTML = `
            <span class="group-title">${solution.label.toUpperCase()}</span>
            <br>
            <span>${solution.words.join(", ")}</span> 
        `;

        document.getElementById("board")
            .insertBefore(solved, document.getElementById("grid"));

        solvedLabels.add(solution.label);

        if (solvedLabels.size === solutions.length) {
            alert("Puzzle complete!");
        }

        
    }

    selected = [];
    updateGridState();
}
