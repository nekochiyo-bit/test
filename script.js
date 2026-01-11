// ゲーム定数
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const BLOCK_SIZE = 30;
const COLORS = {
    I: '#00f0f0',
    O: '#f0f000',
    T: '#a000f0',
    S: '#00f000',
    Z: '#f00000',
    J: '#0000f0',
    L: '#f0a000',
    empty: '#f5f5f5',
    grid: '#e0e0e0'
};

// ブロック形状定義
const TETROMINOS = {
    I: [
        [[0,0,0,0],
         [1,1,1,1],
         [0,0,0,0],
         [0,0,0,0]]
    ],
    O: [
        [[1,1],
         [1,1]]
    ],
    T: [
        [[0,1,0],
         [1,1,1],
         [0,0,0]],
        [[0,1,0],
         [0,1,1],
         [0,1,0]],
        [[0,0,0],
         [1,1,1],
         [0,1,0]],
        [[0,1,0],
         [1,1,0],
         [0,1,0]]
    ],
    S: [
        [[0,1,1],
         [1,1,0],
         [0,0,0]],
        [[0,1,0],
         [0,1,1],
         [0,0,1]]
    ],
    Z: [
        [[1,1,0],
         [0,1,1],
         [0,0,0]],
        [[0,0,1],
         [0,1,1],
         [0,1,0]]
    ],
    J: [
        [[1,0,0],
         [1,1,1],
         [0,0,0]],
        [[0,1,1],
         [0,1,0],
         [0,1,0]],
        [[0,0,0],
         [1,1,1],
         [0,0,1]],
        [[0,1,0],
         [0,1,0],
         [1,1,0]]
    ],
    L: [
        [[0,0,1],
         [1,1,1],
         [0,0,0]],
        [[0,1,0],
         [0,1,0],
         [0,1,1]],
        [[0,0,0],
         [1,1,1],
         [1,0,0]],
        [[1,1,0],
         [0,1,0],
         [0,1,0]]
    ]
};

// ゲーム状態
let game = {
    board: [],
    currentPiece: null,
    nextPiece: null,
    position: { x: 0, y: 0 },
    score: 0,
    level: 1,
    lines: 0,
    gameOver: false,
    paused: false,
    bag: [],
    dropInterval: null,
    dropSpeed: 1000
};

// Canvas要素
const gameCanvas = document.getElementById('gameCanvas');
const gameCtx = gameCanvas.getContext('2d');
const nextCanvas = document.getElementById('nextCanvas');
const nextCtx = nextCanvas.getContext('2d');

// UI要素
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const linesElement = document.getElementById('lines');
const restartBtn = document.getElementById('restartBtn');
const gameOverRestartBtn = document.getElementById('gameOverRestartBtn');
const pauseOverlay = document.getElementById('pauseOverlay');
const gameOverOverlay = document.getElementById('gameOverOverlay');

// 7バッグシステム
function createBag() {
    const pieces = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
    for (let i = pieces.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
    }
    return pieces;
}

function getNextPiece() {
    if (game.bag.length === 0) {
        game.bag = createBag();
    }
    return game.bag.pop();
}

// ゲーム初期化
function initGame() {
    game.board = Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(0));
    game.score = 0;
    game.level = 1;
    game.lines = 0;
    game.gameOver = false;
    game.paused = false;
    game.bag = createBag();
    game.dropSpeed = 1000;

    game.nextPiece = getNextPiece();
    spawnPiece();
    updateUI();

    gameOverOverlay.classList.add('hidden');
    pauseOverlay.classList.add('hidden');

    if (game.dropInterval) {
        clearInterval(game.dropInterval);
    }
    game.dropInterval = setInterval(dropPiece, game.dropSpeed);
}

// 新しいブロックを生成
function spawnPiece() {
    const type = game.nextPiece;
    game.currentPiece = {
        type: type,
        shape: TETROMINOS[type][0],
        rotation: 0
    };
    game.position = {
        x: Math.floor(BOARD_WIDTH / 2) - Math.floor(game.currentPiece.shape[0].length / 2),
        y: 0
    };

    game.nextPiece = getNextPiece();

    // ゲームオーバー判定
    if (collision()) {
        game.gameOver = true;
        clearInterval(game.dropInterval);
        gameOverOverlay.classList.remove('hidden');
    }
}

// 衝突判定
function collision(offsetX = 0, offsetY = 0, newShape = null) {
    const shape = newShape || game.currentPiece.shape;
    const pos = game.position;

    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x]) {
                const newX = pos.x + x + offsetX;
                const newY = pos.y + y + offsetY;

                if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
                    return true;
                }

                if (newY >= 0 && game.board[newY][newX]) {
                    return true;
                }
            }
        }
    }
    return false;
}

// ブロックを盤面に固定
function mergePiece() {
    const shape = game.currentPiece.shape;
    const pos = game.position;

    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x]) {
                const boardY = pos.y + y;
                const boardX = pos.x + x;
                if (boardY >= 0) {
                    game.board[boardY][boardX] = game.currentPiece.type;
                }
            }
        }
    }

    clearLines();
    spawnPiece();
}

// ライン消去
function clearLines() {
    let linesCleared = 0;

    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
        if (game.board[y].every(cell => cell !== 0)) {
            game.board.splice(y, 1);
            game.board.unshift(Array(BOARD_WIDTH).fill(0));
            linesCleared++;
            y++; // 同じ行を再チェック
        }
    }

    if (linesCleared > 0) {
        // スコア計算
        const lineScores = [0, 100, 300, 500, 800];
        game.score += lineScores[linesCleared] * game.level;
        game.lines += linesCleared;

        // レベルアップ（10ラインごと）
        const newLevel = Math.floor(game.lines / 10) + 1;
        if (newLevel > game.level) {
            game.level = newLevel;
            game.dropSpeed = Math.max(100, 1000 - (game.level - 1) * 100);
            clearInterval(game.dropInterval);
            game.dropInterval = setInterval(dropPiece, game.dropSpeed);
        }

        updateUI();
    }
}

// UI更新
function updateUI() {
    scoreElement.textContent = game.score;
    levelElement.textContent = game.level;
    linesElement.textContent = game.lines;
}

// ブロックを下に移動
function dropPiece() {
    if (game.gameOver || game.paused) return;

    if (!collision(0, 1)) {
        game.position.y++;
    } else {
        mergePiece();
    }
    draw();
}

// ブロックを左に移動
function moveLeft() {
    if (game.gameOver || game.paused) return;
    if (!collision(-1, 0)) {
        game.position.x--;
        draw();
    }
}

// ブロックを右に移動
function moveRight() {
    if (game.gameOver || game.paused) return;
    if (!collision(1, 0)) {
        game.position.x++;
        draw();
    }
}

// ブロックを回転
function rotate() {
    if (game.gameOver || game.paused) return;

    const type = game.currentPiece.type;
    const rotations = TETROMINOS[type];
    const nextRotation = (game.currentPiece.rotation + 1) % rotations.length;
    const newShape = rotations[nextRotation];

    // 回転可能か確認
    if (!collision(0, 0, newShape)) {
        game.currentPiece.rotation = nextRotation;
        game.currentPiece.shape = newShape;
        draw();
    } else {
        // 壁蹴り（簡易版）
        for (let offset of [-1, 1, -2, 2]) {
            if (!collision(offset, 0, newShape)) {
                game.position.x += offset;
                game.currentPiece.rotation = nextRotation;
                game.currentPiece.shape = newShape;
                draw();
                return;
            }
        }
    }
}

// ソフトドロップ
function softDrop() {
    if (game.gameOver || game.paused) return;
    dropPiece();
}

// ハードドロップ
function hardDrop() {
    if (game.gameOver || game.paused) return;

    while (!collision(0, 1)) {
        game.position.y++;
        game.score += 2; // ハードドロップボーナス
    }
    mergePiece();
    updateUI();
    draw();
}

// 一時停止
function togglePause() {
    if (game.gameOver) return;

    game.paused = !game.paused;
    if (game.paused) {
        pauseOverlay.classList.remove('hidden');
    } else {
        pauseOverlay.classList.add('hidden');
    }
}

// 描画
function draw() {
    // メイン盤面をクリア
    gameCtx.fillStyle = COLORS.empty;
    gameCtx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);

    // グリッド線を描画
    gameCtx.strokeStyle = COLORS.grid;
    gameCtx.lineWidth = 1;
    for (let y = 0; y <= BOARD_HEIGHT; y++) {
        gameCtx.beginPath();
        gameCtx.moveTo(0, y * BLOCK_SIZE);
        gameCtx.lineTo(BOARD_WIDTH * BLOCK_SIZE, y * BLOCK_SIZE);
        gameCtx.stroke();
    }
    for (let x = 0; x <= BOARD_WIDTH; x++) {
        gameCtx.beginPath();
        gameCtx.moveTo(x * BLOCK_SIZE, 0);
        gameCtx.lineTo(x * BLOCK_SIZE, BOARD_HEIGHT * BLOCK_SIZE);
        gameCtx.stroke();
    }

    // 固定されたブロックを描画
    for (let y = 0; y < BOARD_HEIGHT; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
            if (game.board[y][x]) {
                drawBlock(gameCtx, x * BLOCK_SIZE, y * BLOCK_SIZE, COLORS[game.board[y][x]]);
            }
        }
    }

    // 現在のブロックを描画
    if (game.currentPiece) {
        const shape = game.currentPiece.shape;
        const pos = game.position;
        const color = COLORS[game.currentPiece.type];

        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    drawBlock(gameCtx, (pos.x + x) * BLOCK_SIZE, (pos.y + y) * BLOCK_SIZE, color);
                }
            }
        }
    }

    // 次のブロックを描画
    drawNextPiece();
}

// ブロック描画
function drawBlock(ctx, x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x + 1, y + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);

    // ハイライト効果
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(x + 1, y + 1, BLOCK_SIZE - 2, BLOCK_SIZE / 2 - 1);
}

// 次のブロック描画
function drawNextPiece() {
    nextCtx.fillStyle = COLORS.empty;
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);

    if (game.nextPiece) {
        const shape = TETROMINOS[game.nextPiece][0];
        const color = COLORS[game.nextPiece];
        const blockSize = 25;

        const offsetX = (nextCanvas.width - shape[0].length * blockSize) / 2;
        const offsetY = (nextCanvas.height - shape.length * blockSize) / 2;

        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    drawBlock(nextCtx, offsetX + x * blockSize, offsetY + y * blockSize - blockSize / 2, color);
                }
            }
        }
    }
}

// キーボードイベント
document.addEventListener('keydown', (e) => {
    if (game.gameOver && e.key !== 'p' && e.key !== 'P') return;

    switch(e.key) {
        case 'ArrowLeft':
            e.preventDefault();
            moveLeft();
            break;
        case 'ArrowRight':
            e.preventDefault();
            moveRight();
            break;
        case 'ArrowDown':
            e.preventDefault();
            softDrop();
            break;
        case 'ArrowUp':
            e.preventDefault();
            rotate();
            break;
        case ' ':
            e.preventDefault();
            hardDrop();
            break;
        case 'p':
        case 'P':
            e.preventDefault();
            togglePause();
            break;
    }
});

// タッチ操作ボタン
document.getElementById('btnLeft').addEventListener('click', moveLeft);
document.getElementById('btnRight').addEventListener('click', moveRight);
document.getElementById('btnRotate').addEventListener('click', rotate);
document.getElementById('btnDown').addEventListener('click', softDrop);
document.getElementById('btnDrop').addEventListener('click', hardDrop);

// リスタートボタン
restartBtn.addEventListener('click', initGame);
gameOverRestartBtn.addEventListener('click', initGame);

// ゲーム開始
initGame();
draw();
