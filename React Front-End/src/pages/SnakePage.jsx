import { useCallback, useEffect, useRef, useState } from 'react'
import { requestAuthApi } from '../lib/api'

const GRID_SIZE = 25
const CELL_SIZE = 24
const CANVAS_SIZE = GRID_SIZE * CELL_SIZE
const TICK_MS = 120
const MAX_FRAME_TICKS = 4
const SPRITE_SIZE = 8
const MAX_CHERRIES = 3

const PHASE = {
    IDLE: 'idle',
    STARTING: 'starting',
    PLAYING: 'playing',
    DEAD: 'dead',
}

const START_DIRECTION = Object.freeze({ x: 1, y: 0 })

const DIRECTIONS = Object.freeze({
    ArrowUp: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 },
    w: { x: 0, y: -1 },
    s: { x: 0, y: 1 },
    a: { x: -1, y: 0 },
    d: { x: 1, y: 0 },
    W: { x: 0, y: -1 },
    S: { x: 0, y: 1 },
    A: { x: -1, y: 0 },
    D: { x: 1, y: 0 },
})

const SPRITES = Object.freeze({
    headUp: { sx: 1 * SPRITE_SIZE, sy: 0 },
    headLeft: { sx: 2 * SPRITE_SIZE, sy: 0 },
    headDown: { sx: 3 * SPRITE_SIZE, sy: 0 },
    headRight: { sx: 4 * SPRITE_SIZE, sy: 0 },
    body: { sx: 5 * SPRITE_SIZE, sy: 0 },
    apple: { sx: 6 * SPRITE_SIZE, sy: 0 },
    cherry: { sx: 6 * SPRITE_SIZE, sy: 3 * SPRITE_SIZE },
    wall: { sx: 12 * SPRITE_SIZE, sy: 0 },
})

const cloneCell = (cell) => ({ x: cell.x, y: cell.y })
const cellKey = ({ x, y }) => `${x}:${y}`
const sameCell = (a, b) => a?.x === b?.x && a?.y === b?.y
const lerp = (from, to, amount) => from + (to - from) * amount

function getRandomOpenCell(blockedCells = []) {
    const blocked = new Set(blockedCells.filter(Boolean).map(cellKey))
    const openCells = []

    for (let y = 1; y < GRID_SIZE - 1; y += 1) {
        for (let x = 1; x < GRID_SIZE - 1; x += 1) {
            const cell = { x, y }
            if (!blocked.has(cellKey(cell))) openCells.push(cell)
        }
    }

    if (openCells.length === 0) return null
    return openCells[Math.floor(Math.random() * openCells.length)]
}

function createInitialSnake() {
    return [
        { x: 12, y: 12 },
        { x: 11, y: 12 },
        { x: 10, y: 12 },
    ]
}

function createGameState(now) {
    const snake = createInitialSnake()
    const apple = getRandomOpenCell(snake)
    const firstCherry = getRandomOpenCell([...snake, apple].filter(Boolean))

    return {
        snake,
        previousSnake: snake.map(cloneCell),
        direction: START_DIRECTION,
        nextDirection: START_DIRECTION,
        apple,
        cherries: firstCherry ? [firstCherry] : [],
        score: 0,
        lastTick: now,
    }
}

function getHeadSprite(direction) {
    if (direction.y < 0) return SPRITES.headUp
    if (direction.y > 0) return SPRITES.headDown
    if (direction.x < 0) return SPRITES.headLeft
    return SPRITES.headRight
}

function canTurn(currentDirection, nextDirection) {
    return (
        nextDirection.x !== -currentDirection.x ||
        nextDirection.y !== -currentDirection.y
    )
}

function isWall(cell) {
    return (
        cell.x <= 0 ||
        cell.y <= 0 ||
        cell.x >= GRID_SIZE - 1 ||
        cell.y >= GRID_SIZE - 1
    )
}

function addCherry(state) {
    if (state.cherries.length >= MAX_CHERRIES) return

    const blocked = [...state.snake, state.apple, ...state.cherries]
    const cherry = getRandomOpenCell(blocked)

    if (cherry) state.cherries.push(cherry)
}

function growSnake(state, amount) {
    const tail = state.snake.at(-1)
    const previousTail = state.previousSnake.at(-1) ?? tail

    for (let i = 0; i < amount; i += 1) {
        state.snake.push(cloneCell(tail))
        state.previousSnake.push(cloneCell(previousTail))
    }
}

function advanceGame(state, onScore) {
    state.direction = state.nextDirection
    state.previousSnake = state.snake.map(cloneCell)

    const head = {
        x: state.snake[0].x + state.direction.x,
        y: state.snake[0].y + state.direction.y,
    }

    const ateApple = sameCell(head, state.apple)
    const cherryIndex = state.cherries.findIndex((cherry) => sameCell(cherry, head))
    const ateCherry = cherryIndex !== -1
    const points = ateApple ? 1 : ateCherry ? 3 : 0

    const bodyToCheck = points > 0 ? state.snake : state.snake.slice(0, -1)
    const hitBody = bodyToCheck.some((cell) => sameCell(cell, head))

    if (isWall(head) || hitBody) return false

    state.snake.unshift(head)

    if (ateApple) {
        state.score += points
        onScore(points, state.score)

        const nextApple = getRandomOpenCell([
            ...state.snake,
            ...state.cherries,
        ])

        if (!nextApple) return false

        state.apple = nextApple

        if (state.score % 3 === 0) addCherry(state)

        return true
    }

    if (ateCherry) {
        state.score += points
        state.cherries.splice(cherryIndex, 1)

        growSnake(state, 2)
        onScore(points, state.score)

        return true
    }

    state.snake.pop()
    state.previousSnake.pop()

    return true
}

function drawSprite(ctx, image, sprite, x, y, size) {
    ctx.drawImage(
        image,
        sprite.sx,
        sprite.sy,
        SPRITE_SIZE,
        SPRITE_SIZE,
        x,
        y,
        size,
        size,
    )
}

function drawBackground(ctx) {
    ctx.fillStyle = '#101316'
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    ctx.fillStyle = '#1b2224'

    for (let y = 1; y < GRID_SIZE - 1; y += 1) {
        for (let x = 1; x < GRID_SIZE - 1; x += 1) {
            ctx.fillRect(x * CELL_SIZE + 10, y * CELL_SIZE + 10, 4, 4)
        }
    }
}

function drawWalls(ctx, image) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
        drawSprite(ctx, image, SPRITES.wall, x * CELL_SIZE, 0, CELL_SIZE)
        drawSprite(
            ctx,
            image,
            SPRITES.wall,
            x * CELL_SIZE,
            (GRID_SIZE - 1) * CELL_SIZE,
            CELL_SIZE,
        )
    }

    for (let y = 1; y < GRID_SIZE - 1; y += 1) {
        drawSprite(ctx, image, SPRITES.wall, 0, y * CELL_SIZE, CELL_SIZE)
        drawSprite(
            ctx,
            image,
            SPRITES.wall,
            (GRID_SIZE - 1) * CELL_SIZE,
            y * CELL_SIZE,
            CELL_SIZE,
        )
    }
}

function drawItems(ctx, image, state) {
    if (state.apple) {
        drawSprite(
            ctx,
            image,
            SPRITES.apple,
            state.apple.x * CELL_SIZE,
            state.apple.y * CELL_SIZE,
            CELL_SIZE,
        )
    }

    for (const cherry of state.cherries) {
        drawSprite(
            ctx,
            image,
            SPRITES.cherry,
            cherry.x * CELL_SIZE,
            cherry.y * CELL_SIZE,
            CELL_SIZE,
        )
    }
}

function drawSnake(ctx, image, state, progress) {
    state.snake.forEach((cell, index) => {
        const previous = state.previousSnake[index] ?? cell

        const x = lerp(previous.x, cell.x, progress) * CELL_SIZE
        const y = lerp(previous.y, cell.y, progress) * CELL_SIZE
        const sprite = index === 0 ? getHeadSprite(state.direction) : SPRITES.body

        drawSprite(ctx, image, sprite, x, y, CELL_SIZE)
    })
}

function drawScene(ctx, image, state, now) {
    const progress = Math.min((now - state.lastTick) / TICK_MS, 1)

    drawBackground(ctx)
    drawWalls(ctx, image)
    drawItems(ctx, image, state)
    drawSnake(ctx, image, state, progress)
}

export default function SnakePage({ token }) {
    const canvasRef = useRef(null)
    const contextRef = useRef(null)
    const gameRef = useRef(null)
    const frameRef = useRef(null)
    const spriteRef = useRef(null)
    const runTokenRef = useRef(null)
    const scoreQueueRef = useRef(Promise.resolve())
    const touchStartRef = useRef(null)

    const [score, setScore] = useState(0)
    const [best, setBest] = useState(0)
    const [phase, setPhase] = useState(PHASE.IDLE)
    const [error, setError] = useState(null)

    const stopLoop = useCallback(() => {
        if (frameRef.current) cancelAnimationFrame(frameRef.current)
        frameRef.current = null
    }, [])

    const endGame = useCallback(() => {
        stopLoop()
        setPhase(PHASE.DEAD)
    }, [stopLoop])

    const updateDirection = useCallback((nextDirection) => {
        const game = gameRef.current

        if (!game) return
        if (!canTurn(game.direction, nextDirection)) return

        game.nextDirection = nextDirection
    }, [])

    const recordScoreEvent = useCallback(
        (points, nextScore) => {
            setScore(nextScore)
            setBest((currentBest) => Math.max(currentBest, nextScore))

            scoreQueueRef.current = scoreQueueRef.current
                .catch(() => null)
                .then(async () => {
                    const runToken = runTokenRef.current
                    if (!runToken) return

                    const data = await requestAuthApi(token, '/snake/score/event', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ runToken, points }),
                    })

                    runTokenRef.current = data?.runToken ?? runTokenRef.current

                    const serverBest = Number(data?.bestScore)
                    if (Number.isFinite(serverBest)) setBest(serverBest)
                })
                .catch(() => {
                    setError('Score kon niet worden opgeslagen.')
                })
        },
        [token],
    )

    const loop = useCallback(
        (now) => {
            const ctx = contextRef.current
            const game = gameRef.current
            const sprite = spriteRef.current

            if (!ctx || !game) return

            if (!sprite) {
                frameRef.current = requestAnimationFrame(loop)
                return
            }

            let ticks = 0

            while (now - game.lastTick >= TICK_MS && ticks < MAX_FRAME_TICKS) {
                game.lastTick += TICK_MS
                ticks += 1

                const alive = advanceGame(game, recordScoreEvent)

                if (!alive) {
                    endGame()
                    return
                }
            }

            drawScene(ctx, sprite, game, now)
            frameRef.current = requestAnimationFrame(loop)
        },
        [endGame, recordScoreEvent],
    )

    const startGame = useCallback(async () => {
        if (phase === PHASE.STARTING) return

        setError(null)
        setPhase(PHASE.STARTING)

        try {
            const data = await requestAuthApi(token, '/snake/score/start', {
                method: 'POST',
            })

            const now = performance.now()
            const serverBest = Number(data?.bestScore)

            runTokenRef.current = data?.runToken ?? null
            scoreQueueRef.current = Promise.resolve()
            gameRef.current = createGameState(now)

            setScore(0)
            if (Number.isFinite(serverBest)) setBest(serverBest)

            stopLoop()
            setPhase(PHASE.PLAYING)
            frameRef.current = requestAnimationFrame(loop)
        } catch {
            runTokenRef.current = null
            setPhase(PHASE.IDLE)
            setError('Spel kon niet worden gestart.')
        }
    }, [loop, phase, stopLoop, token])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        ctx.imageSmoothingEnabled = false
        contextRef.current = ctx
    }, [])

    useEffect(() => {
        let cancelled = false
        const sprite = new Image()

        sprite.src = '/snake.png'
        sprite.onload = () => {
            if (!cancelled) spriteRef.current = sprite
        }

        return () => {
            cancelled = true
        }
    }, [])

    useEffect(() => {
        requestAuthApi(token, '/snake/score')
            .then((data) => {
                const bestScore = Number(data?.bestScore)
                if (Number.isFinite(bestScore)) setBest(bestScore)
            })
            .catch(() => {
                setError('High score kon niet worden geladen.')
            })
    }, [token])

    useEffect(() => {
        const handleKeyDown = (event) => {
            const nextDirection = DIRECTIONS[event.key]
            if (!nextDirection) return

            event.preventDefault()
            updateDirection(nextDirection)
        }

        window.addEventListener('keydown', handleKeyDown)

        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            stopLoop()
        }
    }, [stopLoop, updateDirection])

    const handlePointerDown = (event) => {
        touchStartRef.current = {
            x: event.clientX,
            y: event.clientY,
        }
    }

    const handlePointerUp = (event) => {
        const start = touchStartRef.current
        touchStartRef.current = null

        if (!start) return

        const dx = event.clientX - start.x
        const dy = event.clientY - start.y

        if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return

        if (Math.abs(dx) > Math.abs(dy)) {
            updateDirection(dx > 0 ? DIRECTIONS.ArrowRight : DIRECTIONS.ArrowLeft)
        } else {
            updateDirection(dy > 0 ? DIRECTIONS.ArrowDown : DIRECTIONS.ArrowUp)
        }
    }

    const startButtonLabel =
        phase === PHASE.STARTING
            ? 'Laden...'
            : phase === PHASE.DEAD
                ? 'Opnieuw spelen'
                : 'Spelen'

    return (
        <div className="snake-page">
            <section className="snake-panel">
                <div className="snake-hud">
                    <div className="snake-stat">
                        <span>Score</span>
                        <strong>{score}</strong>
                    </div>

                    <div className="snake-stat">
                        <span>Beste</span>
                        <strong>{best}</strong>
                    </div>
                </div>

                {error && <p className="field-error">{error}</p>}

                <div
                    className="snake-board-shell"
                    onPointerDown={handlePointerDown}
                    onPointerUp={handlePointerUp}
                >
                    <canvas
                        ref={canvasRef}
                        width={CANVAS_SIZE}
                        height={CANVAS_SIZE}
                        className="snake-canvas"
                    />

                    {phase !== PHASE.PLAYING && (
                        <div className="snake-overlay">
                            {phase === PHASE.DEAD && (
                                <div className="snake-result">
                                    <strong>Game over</strong>
                                    <span>Score: {score}</span>
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={startGame}
                                className="snake-start-button"
                                disabled={phase === PHASE.STARTING}
                            >
                                {startButtonLabel}
                            </button>
                        </div>
                    )}
                </div>
            </section>
        </div>
    )
}