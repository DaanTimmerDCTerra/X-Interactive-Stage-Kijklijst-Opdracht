import { useEffect, useRef, useState } from 'react'

const GRID = 25
const CELL = 24
const SIZE = GRID * CELL
const SPEED = 120
const SPRITE = 8

function random(snake) {
    let pos
    do {
        pos = {
            x: Math.floor(Math.random() * (GRID - 2)) + 1,
            y: Math.floor(Math.random() * (GRID - 2)) + 1,
        }
    } while (snake.some(s => s.x === pos.x && s.y === pos.y))
    return pos
}

function lerp(a, b, t) {
    return a + (b - a) * t
}

const SPRITES = {
    headUp: { sx: 1 * SPRITE, sy: 0 * SPRITE },
    headLeft: { sx: 2 * SPRITE, sy: 0 * SPRITE },
    headDown: { sx: 3 * SPRITE, sy: 0 * SPRITE },
    headRight: { sx: 4 * SPRITE, sy: 0 * SPRITE },
    body: { sx: 5 * SPRITE, sy: 0 * SPRITE },
    cherry: { sx: 6 * SPRITE, sy: 3 * SPRITE },
    apple: { sx: 6 * SPRITE, sy: 0 * SPRITE },
    wall: { sx: 12 * SPRITE, sy: 0 * SPRITE },
}

function getHeadSprite(dir) {
    if (dir.y === -1) return SPRITES.headUp
    if (dir.x === -1) return SPRITES.headLeft
    if (dir.y === 1) return SPRITES.headDown
    return SPRITES.headRight
}

export default function SnakePage() {
    const canvasRef = useRef(null)
    const stateRef = useRef(null)
    const loopRef = useRef(null)
    const imgRef = useRef(null)
    const [score, setScore] = useState(0)
    const [best, setBest] = useState(() => parseInt(localStorage.getItem('snake_best') || '0'))
    const [phase, setPhase] = useState('idle')

    useEffect(() => {
        const img = new Image()
        img.src = '/snake.png'
        img.onload = () => {
            imgRef.current = img
        }
    }, [])

    const initState = () => {
        const snake = [
            { x: 12, y: 12 },
            { x: 11, y: 12 },
            { x: 10, y: 12 },
        ]
        return {
            snake,
            prev: [...snake],
            dir: { x: 1, y: 0 },
            next: { x: 1, y: 0 },
            apple: random(snake),
            cherries: [random(snake)],
            score: 0,
            lastTick: performance.now(),
        }
    }

    const drawSprite = (ctx, sprite, dx, dy, size) => {
        const img = imgRef.current
        if (!img) return
        ctx.imageSmoothingEnabled = false
        ctx.drawImage(img, sprite.sx, sprite.sy, SPRITE, SPRITE, dx, dy, size, size)
    }

    const draw = (now) => {
        const canvas = canvasRef.current
        if (!canvas || !imgRef.current) return
        const ctx = canvas.getContext('2d')
        const s = stateRef.current
        if (!s) return

        const t = Math.min((now - s.lastTick) / SPEED, 1)

        ctx.fillStyle = '#18181b'
        ctx.fillRect(0, 0, SIZE, SIZE)

        ctx.fillStyle = '#27272a'
        for (let x = 1; x < GRID - 1; x++) {
            for (let y = 1; y < GRID - 1; y++) {
                ctx.fillRect(x * CELL + CELL / 2 - 1, y * CELL + CELL / 2 - 1, 2, 2)
            }
        }

        for (let x = 0; x < GRID; x++) {
            drawSprite(ctx, SPRITES.wall, x * CELL, 0, CELL)
            drawSprite(ctx, SPRITES.wall, x * CELL, (GRID - 1) * CELL, CELL)
        }
        for (let y = 1; y < GRID - 1; y++) {
            drawSprite(ctx, SPRITES.wall, 0, y * CELL, CELL)
            drawSprite(ctx, SPRITES.wall, (GRID - 1) * CELL, y * CELL, CELL)
        }

        drawSprite(ctx, SPRITES.apple, s.apple.x * CELL, s.apple.y * CELL, CELL)

        s.cherries.forEach(c => {
            drawSprite(ctx, SPRITES.cherry, c.x * CELL, c.y * CELL, CELL)
        })

        s.snake.forEach((seg, i) => {
            const prev = s.prev[i] || seg
            const rx = lerp(prev.x, seg.x, t) * CELL
            const ry = lerp(prev.y, seg.y, t) * CELL
            const sprite = i === 0 ? getHeadSprite(s.dir) : SPRITES.body
            drawSprite(ctx, sprite, rx, ry, CELL)
        })
    }

    const tick = () => {
        const s = stateRef.current
        s.dir = s.next
        s.prev = s.snake.map(seg => ({ ...seg }))

        const head = {
            x: s.snake[0].x + s.dir.x,
            y: s.snake[0].y + s.dir.y,
        }

        if (head.x <= 0 || head.x >= GRID - 1 || head.y <= 0 || head.y >= GRID - 1) {
            endGame(); return
        }

        if (s.snake.some(seg => seg.x === head.x && seg.y === head.y)) {
            endGame(); return
        }

        s.snake.unshift(head)

        const ateApple = head.x === s.apple.x && head.y === s.apple.y
        const cherryIndex = s.cherries.findIndex(c => c.x === head.x && c.y === head.y)

        if (ateApple) {
            s.apple = random(s.snake)
            s.score += 1
            if (s.score % 3 === 0) {
                s.cherries.push(random(s.snake))
                if (s.cherries.length > 3) s.cherries.shift()
            }
            setScore(s.score)
            if (s.score > parseInt(localStorage.getItem('snake_best') || '0')) {
                localStorage.setItem('snake_best', s.score)
                setBest(s.score)
            }
        } else if (cherryIndex !== -1) {
            s.cherries.splice(cherryIndex, 1)
            s.score += 3
            setScore(s.score)
            if (s.score > parseInt(localStorage.getItem('snake_best') || '0')) {
                localStorage.setItem('snake_best', s.score)
                setBest(s.score)
            }
            for (let i = 0; i < 3; i++) {
                s.snake.push({ ...s.snake[s.snake.length - 1] })
                s.prev.push({ ...s.prev[s.prev.length - 1] })
            }
        } else {
            s.snake.pop()
            s.prev.pop()
        }
    }

    const loop = (now) => {
        const s = stateRef.current
        if (!s) return

        if (now - s.lastTick >= SPEED) {
            s.lastTick += SPEED
            tick()
        }

        draw(now)
        loopRef.current = requestAnimationFrame(loop)
    }

    const endGame = () => {
        cancelAnimationFrame(loopRef.current)
        setPhase('dead')
    }

    const startGame = () => {
        stateRef.current = initState()
        setScore(0)
        setPhase('playing')
        cancelAnimationFrame(loopRef.current)
        loopRef.current = requestAnimationFrame(loop)
    }

    useEffect(() => {
        const handleKey = (e) => {
            if (!stateRef.current) return
            const s = stateRef.current
            const map = {
                ArrowUp: { x: 0, y: -1 },
                ArrowDown: { x: 0, y: 1 },
                ArrowLeft: { x: -1, y: 0 },
                ArrowRight: { x: 1, y: 0 },
                w: { x: 0, y: -1 },
                s: { x: 0, y: 1 },
                a: { x: -1, y: 0 },
                d: { x: 1, y: 0 },
            }
            const next = map[e.key]
            if (!next) return
            if (next.x === -s.dir.x && next.y === -s.dir.y) return
            e.preventDefault()
            s.next = next
        }

        window.addEventListener('keydown', handleKey)
        return () => {
            window.removeEventListener('keydown', handleKey)
            cancelAnimationFrame(loopRef.current)
        }
    }, [])

    return (
        <div className="fixed inset-0 bg-zinc-950 flex flex-col items-center justify-center ml-56">
            <div className="flex items-center gap-12 mb-6">
                <div className="text-center">
                    <p className="text-zinc-600 text-xs font-semibold uppercase tracking-widest">Score</p>
                    <p className="text-4xl font-bold text-white">{score}</p>
                </div>
                <div className="text-center">
                    <p className="text-zinc-600 text-xs font-semibold uppercase tracking-widest">Best</p>
                    <p className="text-4xl font-bold text-zinc-500">{best}</p>
                </div>
            </div>

            <div className="relative">
                <canvas
                    ref={canvasRef}
                    width={SIZE}
                    height={SIZE}
                    className="border border-zinc-800"
                />
                {phase !== 'playing' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/85 backdrop-blur-sm">
                        {phase === 'dead' && (
                            <>
                                <p className="text-red-400 text-xl font-bold mb-1">Game over</p>
                                <p className="text-zinc-500 text-sm mb-6">Score: {score}</p>
                            </>
                        )}
                        <button
                            onClick={startGame}
                            className="bg-white text-black font-bold px-8 py-3 text-sm hover:bg-zinc-200 transition"
                        >
                            {phase === 'dead' ? 'Opnieuw spelen' : 'Spelen'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}