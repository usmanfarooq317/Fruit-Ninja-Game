'use client'
import React, { useEffect, useRef, useState, useCallback } from 'react';

// Base dimensions
const BASE_WIDTH = 400;
const BASE_HEIGHT = 600;
const ASPECT_RATIO = BASE_HEIGHT / BASE_WIDTH;

// Game constants
const GROUND_HEIGHT = 50;
const SLICE_DURATION = 15;
const FRUIT_SPAWN_RATE = 60;
const BOMB_SPAWN_CHANCE = 0.15;
const INITIAL_LIVES = 3;

// Fruit types with emoji representations
const FRUIT_TYPES = [
  { name: 'Apple', radius: 20, emoji: '🍎', points: 10 },
  { name: 'Orange', radius: 22, emoji: '🍊', points: 15 },
  { name: 'Watermelon', radius: 25, emoji: '🍉', points: 20 },
  { name: 'Pineapple', radius: 24, emoji: '🍍', points: 25 },
  { name: 'Strawberry', radius: 18, emoji: '🍓', points: 30 },
];

// Bomb type with emoji
const BOMB_TYPE = { name: 'Bomb', radius: 22, emoji: '💣', points: 0 };

interface Fruit {
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: number; // Index of FRUIT_TYPES, -1 for bomb
  radius: number;
  rotation: number;
  rotationSpeed: number;
  sliced: boolean;
  sliceTimer: number;
}

interface Slice {
  x: number;
  y: number;
  angle: number;
  timer: number;
}

interface SlicePath {
  x: number;
  y: number;
}

const FruitNinjaGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'playing' | 'paused' | 'gameOver' | 'waiting'>('waiting');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [combo, setCombo] = useState(0);
  const [canvasSize, setCanvasSize] = useState({ width: BASE_WIDTH, height: BASE_HEIGHT });

  const gameStateRef = useRef(gameState);
  const fruitsRef = useRef<Fruit[]>([]);
  const slicesRef = useRef<Slice[]>([]);
  const scoreRef = useRef(0);
  const livesRef = useRef(INITIAL_LIVES);
  const comboRef = useRef(0);
  const comboTimeoutRef = useRef<number | null>(null);
  const spawnTimerRef = useRef(0);
  const scaleRef = useRef(1);
  
  // Slice tracking
  const isSlicingRef = useRef(false);
  const slicePathRef = useRef<SlicePath[]>([]);
  const lastSliceCheckRef = useRef<{ x: number; y: number } | null>(null);

  // Update canvas size on mount and resize
  const updateCanvasSize = useCallback(() => {
    const maxWidth = Math.min(window.innerWidth * 0.9, BASE_WIDTH);
    const height = maxWidth * ASPECT_RATIO;
    setCanvasSize({ width: maxWidth, height });
    scaleRef.current = maxWidth / BASE_WIDTH;
  }, []);

  useEffect(() => {
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [updateCanvasSize]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scale = scaleRef.current;
    const SCALED_GROUND = GROUND_HEIGHT * scale;

    // Scale canvas for high-DPI displays
    canvas.width = canvasSize.width * window.devicePixelRatio;
    canvas.height = canvasSize.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Draw beautiful gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvasSize.height);
    gradient.addColorStop(0, 'hsl(220, 13%, 8%)');
    gradient.addColorStop(1, 'hsl(220, 13%, 12%)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

    // Add star-like effects
    ctx.fillStyle = 'hsl(193, 76%, 56%)';
    for (let i = 0; i < 50; i++) {
      const x = (i * 37) % canvasSize.width;
      const y = (i * 41) % canvasSize.height;
      ctx.fillRect(x, y, 1 * scale, 1 * scale);
    }

    // Draw ground
    ctx.fillStyle = 'hsl(120, 30%, 20%)';
    ctx.fillRect(0, canvasSize.height - SCALED_GROUND, canvasSize.width, SCALED_GROUND);

    // Draw fruits
    fruitsRef.current.forEach(fruit => {
      const type = fruit.type === -1 ? BOMB_TYPE : FRUIT_TYPES[fruit.type];
      ctx.save();
      ctx.translate(fruit.x, fruit.y);
      ctx.rotate(fruit.rotation);
      
      // Set font for emoji rendering
      ctx.font = `${fruit.radius * 2 * scale}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      if (fruit.sliced) {
        // Draw fruit halves with emoji
        ctx.fillText(type.emoji, -fruit.radius * 0.5, 0);
        ctx.fillText(type.emoji, fruit.radius * 0.5, 0);
      } else {
        // Draw whole fruit with emoji
        ctx.fillText(type.emoji, 0, 0);
        
        // Draw bomb fuse if it's a bomb
        if (fruit.type === -1) {
          ctx.fillStyle = 'hsl(30, 100%, 50%)';
          ctx.beginPath();
          ctx.arc(-fruit.radius * 0.6, -fruit.radius * 0.6, fruit.radius * 0.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      
      ctx.restore();
    });

    // Draw slice trail while dragging
    if (isSlicingRef.current && slicePathRef.current.length > 1) {
      ctx.strokeStyle = 'hsl(0, 0%, 100%)';
      ctx.lineWidth = 4 * scale;
      ctx.shadowColor = 'hsl(193, 76%, 56%)';
      ctx.shadowBlur = 10 * scale;
      
      ctx.beginPath();
      ctx.moveTo(slicePathRef.current[0].x, slicePathRef.current[0].y);
      for (let i = 1; i < slicePathRef.current.length; i++) {
        ctx.lineTo(slicePathRef.current[i].x, slicePathRef.current[i].y);
      }
      ctx.stroke();
      
      ctx.shadowBlur = 0;
    }

    // Draw slices
    slicesRef.current.forEach(slice => {
      ctx.strokeStyle = 'hsl(0, 0%, 100%)';
      ctx.lineWidth = 3 * scale;
      ctx.shadowColor = 'hsl(193, 76%, 56%)';
      ctx.shadowBlur = 8 * scale;
      
      ctx.beginPath();
      const dx = Math.cos(slice.angle) * 50 * scale;
      const dy = Math.sin(slice.angle) * 50 * scale;
      ctx.moveTo(slice.x - dx, slice.y - dy);
      ctx.lineTo(slice.x + dx, slice.y + dy);
      ctx.stroke();
      
      ctx.shadowBlur = 0;
    });

    // Draw HUD
    ctx.fillStyle = 'hsl(322, 81%, 56%)';
    ctx.font = `bold ${24 * scale}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(scoreRef.current.toString(), canvasSize.width / 2, 30 * scale);

    ctx.fillStyle = 'hsl(271, 81%, 56%)';
    ctx.font = `bold ${20 * scale}px monospace`;
    ctx.textAlign = 'left';
    ctx.fillText(`Lives: ${livesRef.current}`, 10 * scale, 30 * scale);

    if (comboRef.current > 1) {
      ctx.fillStyle = 'hsl(50, 100%, 50%)';
      ctx.font = `bold ${18 * scale}px monospace`;
      ctx.textAlign = 'right';
      ctx.fillText(`Combo: x${comboRef.current}`, canvasSize.width - 10 * scale, 30 * scale);
    }

    if (gameStateRef.current === 'gameOver') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
      
      ctx.fillStyle = 'hsl(271, 81%, 56%)';
      ctx.font = `${32 * scale}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', canvasSize.width / 2, canvasSize.height / 2 - 40 * scale);
      
      ctx.fillStyle = 'hsl(193, 76%, 56%)';
      ctx.font = `${16 * scale}px monospace`;
      ctx.fillText(`Score: ${scoreRef.current}`, canvasSize.width / 2, canvasSize.height / 2);
      ctx.fillText(`High Score: ${highScore}`, canvasSize.width / 2, canvasSize.height / 2 + 30 * scale);
    }
  }, [canvasSize, highScore]);

  const update = useCallback(() => {
    if (gameStateRef.current !== 'playing') return;

    const scale = scaleRef.current;
    const SCALED_GROUND = GROUND_HEIGHT * scale;

    // Spawn new fruits
    spawnTimerRef.current++;
    if (spawnTimerRef.current >= FRUIT_SPAWN_RATE) {
      spawnTimerRef.current = 0;
      
      const isBomb = Math.random() < BOMB_SPAWN_CHANCE;
      const type = isBomb ? -1 : Math.floor(Math.random() * FRUIT_TYPES.length);
      const radius = (isBomb ? BOMB_TYPE.radius : FRUIT_TYPES[type].radius) * scale;
      
      fruitsRef.current.push({
        x: Math.random() * (canvasSize.width - radius * 2) + radius,
        y: canvasSize.height + radius,
        vx: (Math.random() - 0.5) * 2,
        vy: - (8 + Math.random() * 4),
        type,
        radius,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.1,
        sliced: false,
        sliceTimer: 0
      });
    }

    // Update fruits
    for (let i = fruitsRef.current.length - 1; i >= 0; i--) {
      const fruit = fruitsRef.current[i];
      
      if (fruit.sliced) {
        fruit.sliceTimer++;
        fruit.vy += 0.3 * scale; // Gravity for sliced fruits
        fruit.y += fruit.vy;
        fruit.rotation += fruit.rotationSpeed;
        
        if (fruit.sliceTimer > SLICE_DURATION) {
          fruitsRef.current.splice(i, 1);
        }
      } else {
        fruit.vy += 0.15 * scale; // Gravity
        fruit.y += fruit.vy;
        fruit.x += fruit.vx;
        fruit.rotation += fruit.rotationSpeed;
        
        // Bounce off walls
        if (fruit.x - fruit.radius < 0 || fruit.x + fruit.radius > canvasSize.width) {
          fruit.vx = -fruit.vx * 0.8;
          fruit.x = Math.max(fruit.radius, Math.min(fruit.x, canvasSize.width - fruit.radius));
        }
        
        // Remove fruits that fall off the bottom
        if (fruit.y - fruit.radius > canvasSize.height) {
          fruitsRef.current.splice(i, 1);
          if (!fruit.sliced && fruit.type !== -1) {
            // Lose a life if a fruit is missed
            livesRef.current--;
            setLives(livesRef.current);
            
            if (livesRef.current <= 0) {
              setGameState('gameOver');
              gameStateRef.current = 'gameOver';
              if (scoreRef.current > highScore) {
                setHighScore(scoreRef.current);
              }
            }
          }
        }
      }
    }

    // Update slices
    for (let i = slicesRef.current.length - 1; i >= 0; i--) {
      slicesRef.current[i].timer--;
      if (slicesRef.current[i].timer <= 0) {
        slicesRef.current.splice(i, 1);
      }
    }

    // Reset combo if no fruits were sliced for a while
    if (comboTimeoutRef.current) {
      comboTimeoutRef.current--;
      if (comboTimeoutRef.current <= 0) {
        comboRef.current = 0;
        setCombo(0);
        comboTimeoutRef.current = null;
      }
    }
  }, [canvasSize, highScore]);

  const gameLoop = useCallback(() => {
    update();
    draw();
  }, [update, draw]);

  useEffect(() => {
    const interval = setInterval(gameLoop, 16);
    return () => clearInterval(interval);
  }, [gameLoop]);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Check if slice path intersects with fruit
  const checkSliceCollision = useCallback((fruit: Fruit, path: SlicePath[]) => {
    if (path.length < 2) return false;
    
    // Check if any segment of the slice path intersects with the fruit
    for (let i = 1; i < path.length; i++) {
      const p1 = path[i - 1];
      const p2 = path[i];
      
      // Distance from fruit center to line segment
      const A = p2.x - p1.x;
      const B = p2.y - p1.y;
      const C = p1.x - fruit.x;
      const D = p1.y - fruit.y;
      
      const dot = -C * A - D * B;
      const lenSq = A * A + B * B;
      let param = -1;
      
      if (lenSq !== 0) {
        param = dot / lenSq;
      }
      
      let xx, yy;
      
      if (param < 0) {
        xx = p1.x;
        yy = p1.y;
      } else if (param > 1) {
        xx = p2.x;
        yy = p2.y;
      } else {
        xx = p1.x + param * A;
        yy = p1.y + param * B;
      }
      
      const dx = fruit.x - xx;
      const dy = fruit.y - yy;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < fruit.radius) {
        return true;
      }
    }
    
    return false;
  }, []);

  const handleSlice = useCallback((path: SlicePath[]) => {
    if (gameStateRef.current !== 'playing' || path.length < 2) return;
    
    // Get the slice angle from the path
    const start = path[0];
    const end = path[path.length - 1];
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    
    // Add slice effect at the end of the path
    slicesRef.current.push({ x: end.x, y: end.y, angle, timer: 15 });
    
    // Check for fruit hits along the entire slice path
    let hitSomething = false;
    
    for (let i = fruitsRef.current.length - 1; i >= 0; i--) {
      const fruit = fruitsRef.current[i];
      if (fruit.sliced) continue;
      
      if (checkSliceCollision(fruit, path)) {
        if (fruit.type === -1) {
          // Hit a bomb - game over
          setGameState('gameOver');
          gameStateRef.current = 'gameOver';
          if (scoreRef.current > highScore) {
            setHighScore(scoreRef.current);
          }
          return;
        }
        
        // Slice the fruit
        fruit.sliced = true;
        fruit.vx = (Math.random() - 0.5) * 5;
        fruit.vy = -Math.abs(fruit.vy) * 0.7;
        
        // Add to score
        const points = FRUIT_TYPES[fruit.type].points * (comboRef.current > 0 ? comboRef.current : 1);
        scoreRef.current += points;
        setScore(scoreRef.current);
        
        // Increase combo
        comboRef.current++;
        setCombo(comboRef.current);
        comboTimeoutRef.current = 60; // 1 second at 60fps
        
        hitSomething = true;
      }
    }
  }, [highScore, checkSliceCollision]);

  const getEventPosition = useCallback((e: MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    
    const rect = canvas.getBoundingClientRect();
    const scale = canvasSize.width / canvas.offsetWidth;
    const x = (('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left) * scale;
    const y = (('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top) * scale;
    
    return { x, y };
  }, [canvasSize]);

  const handleStart = useCallback((e: MouseEvent | TouchEvent) => {
    if (gameStateRef.current !== 'playing') return;
    
    e.preventDefault();
    const pos = getEventPosition(e);
    if (!pos) return;
    
    isSlicingRef.current = true;
    slicePathRef.current = [pos];
    lastSliceCheckRef.current = pos;
  }, [getEventPosition]);

  const handleMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (gameStateRef.current !== 'playing' || !isSlicingRef.current) return;
    
    e.preventDefault();
    const pos = getEventPosition(e);
    if (!pos) return;
    
    // Add to slice path
    slicePathRef.current.push(pos);
    
    // Keep only recent path points to avoid performance issues
    if (slicePathRef.current.length > 10) {
      slicePathRef.current.shift();
    }
    
    // Check for collision with the current slice segment
    if (lastSliceCheckRef.current) {
      const segmentPath = [lastSliceCheckRef.current, pos];
      
      for (let i = fruitsRef.current.length - 1; i >= 0; i--) {
        const fruit = fruitsRef.current[i];
        if (fruit.sliced) continue;
        
        if (checkSliceCollision(fruit, segmentPath)) {
          if (fruit.type === -1) {
            // Hit a bomb - game over
            setGameState('gameOver');
            gameStateRef.current = 'gameOver';
            if (scoreRef.current > highScore) {
              setHighScore(scoreRef.current);
            }
            return;
          }
          
          // Slice the fruit
          fruit.sliced = true;
          fruit.vx = (Math.random() - 0.5) * 5;
          fruit.vy = -Math.abs(fruit.vy) * 0.7;
          
          // Add slice effect
          const angle = Math.atan2(pos.y - lastSliceCheckRef.current.y, pos.x - lastSliceCheckRef.current.x);
          slicesRef.current.push({ x: fruit.x, y: fruit.y, angle, timer: 15 });
          
          // Add to score
          const points = FRUIT_TYPES[fruit.type].points * (comboRef.current > 0 ? comboRef.current : 1);
          scoreRef.current += points;
          setScore(scoreRef.current);
          
          // Increase combo
          comboRef.current++;
          setCombo(comboRef.current);
          comboTimeoutRef.current = 60; // 1 second at 60fps
        }
      }
    }
    
    lastSliceCheckRef.current = pos;
  }, [getEventPosition, checkSliceCollision, highScore]);

  const handleEnd = useCallback(() => {
    isSlicingRef.current = false;
    slicePathRef.current = [];
    lastSliceCheckRef.current = null;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Mouse events
    const handleMouseDown = (e: MouseEvent) => handleStart(e);
    const handleMouseMove = (e: MouseEvent) => handleMove(e);
    const handleMouseUp = () => handleEnd();
    
    // Touch events
    const handleTouchStart = (e: TouchEvent) => handleStart(e);
    const handleTouchMove = (e: TouchEvent) => handleMove(e);
    const handleTouchEnd = () => handleEnd();

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);
    
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', handleTouchEnd);
    canvas.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseUp);
      
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [handleStart, handleMove, handleEnd]);

  const startGame = () => {
    fruitsRef.current = [];
    slicesRef.current = [];
    scoreRef.current = 0;
    setScore(0);
    livesRef.current = INITIAL_LIVES;
    setLives(INITIAL_LIVES);
    comboRef.current = 0;
    setCombo(0);
    spawnTimerRef.current = 0;
    setGameState('playing');
    gameStateRef.current = 'playing';
  };

  const togglePause = () => {
    if (gameState === 'playing') {
      setGameState('paused');
      gameStateRef.current = 'paused';
    } else if (gameState === 'paused') {
      setGameState('playing');
      gameStateRef.current = 'playing';
    }
  };

  const resetGame = () => {
    setGameState('waiting');
    gameStateRef.current = 'waiting';
    fruitsRef.current = [];
    slicesRef.current = [];
    scoreRef.current = 0;
    setScore(0);
    livesRef.current = INITIAL_LIVES;
    setLives(INITIAL_LIVES);
    comboRef.current = 0;
    setCombo(0);
    draw();
  };

  return (
    <div className="flex flex-col items-center space-y-4 p-4 sm:p-6 bg-gray-900 rounded-lg w-full max-w-md mx-auto">
      <div className="flex flex-col sm:flex-row justify-between w-full text-center gap-4">
        <div>
          <div className="text-xs sm:text-sm text-gray-400">Score</div>
          <div className="text-lg sm:text-2xl font-bold text-cyan-400">{score}</div>
        </div>
        <div>
          <div className="text-xs sm:text-sm text-gray-400">High Score</div>
          <div className="text-lg sm:text-2xl font-bold text-purple-400">{highScore}</div>
        </div>
        <div>
          <div className="text-xs sm:text-sm text-gray-400">Lives</div>
          <div className="text-lg sm:text-2xl font-bold text-red-400">{lives}</div>
        </div>
        {combo > 1 && (
          <div>
            <div className="text-xs sm:text-sm text-gray-400">Combo</div>
            <div className="text-lg sm:text-2xl font-bold text-yellow-400">x{combo}</div>
          </div>
        )}
      </div>

      <div className="relative border-2 border-gray-700 rounded-lg overflow-hidden w-full" style={{ maxWidth: '400px' }}>
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          className="block cursor-crosshair w-full touch-none"
          style={{ height: `${canvasSize.height}px` }}
        />
      </div>

      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 w-full justify-center">
        {gameState === 'waiting' && (
          <button 
            onClick={startGame} 
            className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            Start Game
          </button>
        )}
        
        {(gameState === 'playing' || gameState === 'paused') && (
          <>
            <button 
              onClick={togglePause} 
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition-colors border border-gray-500"
            >
              {gameState === 'playing' ? 'Pause' : 'Resume'}
            </button>
            <button 
              onClick={resetGame} 
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition-colors border border-gray-500"
            >
              Reset
            </button>
          </>
        )}

        {gameState === 'gameOver' && (
          <>
            <button 
              onClick={startGame} 
              className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              Play Again
            </button>
            <button 
              onClick={resetGame} 
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition-colors border border-gray-500"
            >
              Reset
            </button>
          </>
        )}
      </div>

      <div className="text-center text-xs sm:text-sm text-gray-400 w-full">
        <p>Click and drag to slice fruits. Avoid bombs!</p>
        <p>Build combos by slicing multiple fruits quickly.</p>
      </div>
    </div>
  );
};

export default FruitNinjaGame;