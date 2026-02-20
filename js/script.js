let alertBox = document.getElementById('alertBox')
let selected = [];
let solvedLabels = new Set();
let guessHistory = [];

const COLOR_MAP = {
    yellow: "#F9DF6D",
    green: "#A0C35A",
    blue: "#5DA9E9",
    purple: "#B07ACF"
};


let messageTimeout = null;

function tempMessage(text, win = false, ms = 4000) {
    alertBox.innerHTML = text;
    alertBox.style = win ? "color: #00AA00; text-shadow: 2px 2px 0px #002A00;" : "color: #FF5555; text-shadow: 2px 2px 0px #3f1515;";

    if (messageTimeout) clearTimeout(messageTimeout);

    messageTimeout = setTimeout(() => {
        alertBox.innerHTML = "&nbsp;";
        messageTimeout = null;
    }, ms);
}

function shareResults() {
    const EMOJI_MAP = {
        yellow: "🟨",
        green: "🟩",
        blue: "🟦",
        purple: "🟪",
        gray: "⬜" //failsafe idk
    };

    let resultString = "Skynnections\n";
    
    guessHistory.forEach(guess => {
        if (Array.isArray(guess)) {
            resultString += guess.map(c => EMOJI_MAP[c]).join("") + "\n";
        } else {
            resultString += EMOJI_MAP[guess].repeat(4) + "\n";
        }
    });

    navigator.clipboard.writeText(resultString).then(() => {
        tempMessage("Results copied to clipboard!", true);
    }).catch(() => {
        tempMessage("Failed to copy results.");
    });
}

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

    updateGridState();

    shuffle(tiles);

    tiles.forEach(tile => grid.appendChild(tile));

    tiles.forEach(tile => tile.classList.add("fade"));
        setTimeout(() => {
            tiles.forEach(tile => tile.classList.remove("fade"))
        }, 400);
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

    document.getElementById("share").onclick = shareResults;
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
        tempMessage("Select exactly 4 words");
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
            <span>${solution.words.join(", ")}</span> 
        `;

        document.getElementById("board").insertBefore(solved, document.getElementById("grid"));

        solvedLabels.add(solution.label);

        if (solvedLabels.size === solutions.length) {
            tempMessage("Puzzle complete!", true, 20000);
            document.getElementById('shuffle').style.display = "none"
            document.getElementById('share').style.display = "inline-block"
        }
        selected = [];
        guessHistory.push(solution.color);
    } else {
        let isOneAway = false;

        solutions.forEach(sol => {
            if (!solvedLabels.has(sol.label)) {
                const matches = sol.words.filter(w => words.includes(w)).length;
                if (matches === 3) isOneAway = true;
            }
        });

        tempMessage(isOneAway ? "One away..." : "Incorrect");

        selected.forEach(s => s.div.classList.add("shake"));
        setTimeout(() => {
            selected.forEach(s => s.div.classList.remove("shake"))
        }, 400);

        let guessColors = selected.map(s => {
            let found = solutions.find(sol => sol.words.includes(s.word));
            return found ? found.color : 'gray'; //failsafe idk
        });
        guessHistory.push(guessColors);
    }
    updateGridState();
}
