// 初始化 GUN
const gun = Gun({
    peers: ['https://gun-manhattan.herokuapp.com/gun']
});

// 遊戲狀態
let gameState = {
    currentPlayer: null,
    board: Array(9).fill(''),
    players: [],
    gameStarted: false
};

// DOM 元素
const playerNameInput = document.getElementById('playerName');
const joinGameButton = document.getElementById('joinGame');
const gameBoard = document.getElementById('game-board');
const resetGameButton = document.getElementById('resetGame');
const gameStatus = document.getElementById('game-status');
const cells = document.querySelectorAll('.cell');

// GUN 資料節點
const gameData = gun.get('tic-tac-toe-' + Date.now()); // 使用時間戳建立唯一遊戲實例

// 勝利條件
const winPatterns = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // 橫排
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // 直排
    [0, 4, 8], [2, 4, 6] // 對角線
];

// 加入遊戲
joinGameButton.addEventListener('click', () => {
    const playerName = playerNameInput.value.trim();
    if (!playerName) {
        alert('請輸入您的名字！');
        return;
    }

    gameData.get('players').set({
        name: playerName,
        timestamp: Date.now()
    });

    gameState.currentPlayer = playerName;
    playerNameInput.disabled = true;
    joinGameButton.disabled = true;
    gameBoard.classList.remove('hidden');
    resetGameButton.classList.remove('hidden');
});

// 監聽玩家加入
gameData.get('players').map().on(function(player, id) {
    if (player && !gameState.players.find(p => p.name === player.name)) {
        gameState.players.push(player);
        updateGameStatus();
    }
});

// 監聽遊戲動作
gameData.get('moves').map().on(function(move, id) {
    if (move) {
        gameState.board[move.index] = move.symbol;
        const cell = document.querySelector(`[data-index="${move.index}"]`);
        cell.textContent = move.symbol;
        cell.classList.add(move.symbol);
        checkWinner();
        updateGameStatus();
    }
});

// 更新遊戲狀態顯示
function updateGameStatus() {
    if (gameState.players.length < 2) {
        gameStatus.textContent = '等待其他玩家加入...';
        return;
    }

    if (!gameState.gameStarted) {
        gameState.gameStarted = true;
        gameStatus.textContent = `遊戲開始！ ${gameState.players[0].name} (X) vs ${gameState.players[1].name} (O)`;
    }
}

// 檢查是否獲勝
function checkWinner() {
    for (let pattern of winPatterns) {
        const [a, b, c] = pattern;
        if (gameState.board[a] && 
            gameState.board[a] === gameState.board[b] && 
            gameState.board[a] === gameState.board[c]) {
            gameStatus.textContent = `遊戲結束！ ${gameState.board[a]} 獲勝！`;
            disableBoard();
            return;
        }
    }

    if (!gameState.board.includes('')) {
        gameStatus.textContent = '遊戲結束！平手！';
        disableBoard();
    }
}

// 禁用遊戲板
function disableBoard() {
    cells.forEach(cell => cell.style.pointerEvents = 'none');
}

// 重置遊戲
resetGameButton.addEventListener('click', () => {
    // 清除 GUN.js 資料
    gameData.get('moves').put(null);
    gameData.get('players').put(null);

    // 重置遊戲狀態
    gameState = {
        currentPlayer: gameState.currentPlayer, // 保留當前玩家名稱
        board: Array(9).fill(''),
        players: [],
        gameStarted: false
    };

    // 重置 UI
    cells.forEach(cell => {
        cell.textContent = '';
        cell.className = 'cell';
        cell.style.pointerEvents = 'auto';
    });

    // 重新啟用輸入
    playerNameInput.disabled = false;
    joinGameButton.disabled = false;
    gameBoard.classList.add('hidden');
    resetGameButton.classList.add('hidden');

    // 更新狀態顯示
    gameStatus.textContent = '請輸入您的名字開始新遊戲';

    // 重新連接到新的遊戲實例
    const newGameData = gun.get('tic-tac-toe-' + Date.now());
    window.location.reload(); // 重新載入頁面以確保完全重置
});

// 處理玩家點擊
cells.forEach(cell => {
    cell.addEventListener('click', () => {
        const index = parseInt(cell.dataset.index);
        if (gameState.board[index] || gameState.players.length < 2) return;

        const playerIndex = gameState.players.findIndex(p => p.name === gameState.currentPlayer);
        const symbol = playerIndex === 0 ? 'X' : 'O';

        // 確認是否輪到當前玩家
        const currentSymbol = gameState.board.filter(x => x).length % 2 === 0 ? 'X' : 'O';
        if (symbol !== currentSymbol) {
            alert('還沒輪到您！');
            return;
        }

        gameData.get('moves').set({
            index,
            symbol,
            player: gameState.currentPlayer
        });
    });
});