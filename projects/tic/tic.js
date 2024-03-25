const socket = io();

const text = document.getElementById("text")
const text2 = document.getElementById("text2")
const textbutton = document.getElementById("textbutton")
const press =textbutton.addEventListener("click",Press)

let clientTurn =0
socket.on("turn",serverTurn => {
    clientTurn =serverTurn
})
function Press(){
    textbutton.disabled = true
    socket.emit("buttonpress","pressed")
    clientTurn++
}
 socket.on('buttonstate', (serverTurn) => {
    text.innerHTML = "server"+serverTurn
    if(serverTurn > clientTurn){
        textbutton.disabled=false
        clientTurn =serverTurn
    }
    text2.innerHTML = "client"+clientTurn
});
socket.once('playernum', (playernum) => {
    text.innerHTML = "player "+playernum
});



// function hello(){
//     console.log("redrum")
// }
// module.exports = {
//     hello: hello
// };
//console.log("redhum123")

var currentPlayer; // string
var keepPlaying; // bool
var row, col; // int
var board;

let turn=0;
const ticTacToeContainer = document.getElementById("tic-tac-toe-container");
let playerIdstatment = document.getElementById("current-player");
const xs_and_os = document.getElementById("xs-and-os");
const popup = document.getElementById("popup-container");
const playAgainBtn = document.getElementById('play-button');
const fin = document.getElementById('final-message');

const t= "redrum"
document.getElementById("arr").addEventListener("click",arr)
function arr(){
    console.log(board)
}

playAgainBtn.addEventListener("click",function(){
    keepPlaying =true;
    turn = 0;
    //board[row][col] ="";
    for (var x = 0; x < board.length; x++) {
        for (var y = 0; y < board[x].length; y++) {
            board[x][y] = "";
        }
    
    }
    xs_and_os.innerHTML ="";
    winner =false;
    popup.style.display = "none";
});

ticTacToeContainer.addEventListener("click",click)
function click(){
    setTimeout(function(){socket.emit("board",board)},1000)
    //socket.emit("board",board)
}
socket.on("board",(b)=>{
    //console.log(b)
    board = b
})

function main() {
    currentPlayer = "X";
    keepPlaying = true;
    playerIdstatment.innerHTML = currentPlayer;
    board = [
        ['', '', ''],
        ['', '', ''],
        ['', '', '']
    ];
}

function switchPlayer() {
    if (currentPlayer == "X") {
        currentPlayer = "O";
        playerIdstatment.innerHTML = currentPlayer;
    }
    else if (currentPlayer == "O") {
        currentPlayer = "X";
        playerIdstatment.innerHTML = currentPlayer;
    }
}

function getRowCol(event) {
    var x = event.offsetX;
    var y = event.offsetY;
    // Row 0
    if (x >= 0 && x <= 73 && y >= 0 && y <= 73) {
        row = 0;
        col = 0;
    }
    else if (x >= 77 && x <= 148 && y >= 0 && y <= 73) {
        row = 0;
        col = 1;
    }
    else if (x >= 152 && x <= 225 && y >= 0 && y <= 73) {
        row = 0;
        col = 2;
    }
    // row 1
    else if (x >= 0 && x <= 73 && y >= 77 && y <= 148) {
        row = 1;
        col = 0;
    }
    else if (x >= 77 && x <= 148 && y >= 77 && y <= 148) {
        row = 1;
        col = 1;
    }
    else if (x >= 152 && x <= 225 && y >= 77 && y <= 148) {
        row = 1;
        col = 2;
    }
    // row 2
    else if (x >= 0 && x <= 73 && y >= 152 && y <= 225) {
        row = 2;
        col = 0;
    }
    else if (x >= 77 && x <= 148 && y >= 152 && y <= 225) {
        row = 2;
        col = 1;
    }
    else if (x >= 152 && x <= 225 && y >= 152 && y <= 225) {
        row = 2;
        col = 2;
    }
    else {
        row = -1;
        col = -1;
    }
    return row, col;
}

function markBoard(row, col) {
    var marked = false;
    if (row >= 0 && col >= 0) {
        if (board[row][col] === "") {
            board[row][col] = currentPlayer;
            drawMark(row, col);
            marked = true;
        } else {
            //console.log("Spot is being used");
        }
    }
    return marked;
}

function drawMark(row, col) {
    if (currentPlayer === "X") {
        const line1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
        const line2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line1.setAttribute("x1", 15 + (col * 75));
        line1.setAttribute("y1", 15 + (row * 75));
        line1.setAttribute("x2", 60 + (col * 75));
        line1.setAttribute("y2", 60 + (row * 75));
        line2.setAttribute("x1", 15 + (col * 75));
        line2.setAttribute("y1", 60 + (row * 75));
        line2.setAttribute("x2", 60 + (col * 75));
        line2.setAttribute("y2", 15 + (row * 75));
        xs_and_os.appendChild(line1);
        xs_and_os.appendChild(line2);
    } else {
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", 37 + (col * 75));
        circle.setAttribute("cy", 37 + (row * 75));
        circle.setAttribute("r", 25);
        xs_and_os.appendChild(circle);
    }
}

ticTacToeContainer.addEventListener("click", function (event) {
    row, col = getRowCol(event);
    
    if (keepPlaying) {
        marked = markBoard(row, col);
        if (marked) {
            checkWinner();
            switchPlayer();
            turn++;
            //console.log(turn);
            if(turn === 9){
                winner = true;
                //console.log("ther is no winner!");
                //console.log(keepPlaying);
                fin.innerHTML = "no one has won!";
                popup.style.display ="flex";
            }
        }
    }

    //console.log(board);
});
function checkWinner() {
    let winner = false;
    if (board[0][0] === board[0][1] && board[0][1] === board[0][2] && board[0][0] !== "") {
        keepPlaying = false;
    }
    else if (board[1][0] === board[1][1] && board[1][1] === board[1][2] && board[1][1] !== "") {
        keepPlaying = false;
    }
    else if (board[2][0] === board[2][1] && board[2][1] === board[2][2] && board[2][1] !== "") {
        keepPlaying = false;
    }
    else if (board[0][0] === board[1][0] && board[1][0] === board[2][0] && board[1][0] !== "") {
        keepPlaying = false;
    }
    else if (board[0][1] === board[1][1] && board[1][1] === board[2][1] && board[1][1] !== "") {
        keepPlaying = false;
    }
    else if (board[0][2] === board[1][2] && board[1][2] === board[2][2] && board[2][2] !== "") {
        keepPlaying = false;
    }
    else if (board[0][0] === board[1][1] && board[1][1] === board[2][2] && board[2][2] !== "") {
        keepPlaying = false;
    }
    else if (board[0][2] === board[1][1] && board[1][1] === board[2][0] && board[2][0] !== "") {
        keepPlaying = false;
    }
    if (keepPlaying === false) {
        winner = true;
        //console.log("player " + currentPlayer + " is the winner!");
        //console.log(keepPlaying);
        fin.innerHTML = "player "+currentPlayer+" has won!";
        popup.style.display ="flex";
    }

}

//checkWinner();
main();
//console.log(keepPlaying);