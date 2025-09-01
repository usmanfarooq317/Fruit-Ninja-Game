```markdown
# Ping Pong Go!

Ping Pong Go! is a Breakout-style table tennis game built with React, TypeScript, Tailwind CSS, and HTML5 Canvas. It features neon graphics, mobile-responsive design, and five challenging levels with unique block placements. Players control a paddle to hit a ball, destroy blocks, and progress through levels, aiming for a high score and top rating.

## Features
- **Gameplay**: Control a paddle at the bottom to hit a ball and destroy blocks at the top. Score +1 for paddle hits, +10 for each block destroyed.
- **Levels**:
  - **Level 1**: 4x8 grid of blocks (32 blocks).
  - **Level 2**: Checkerboard pattern (16 blocks, alternating).
  - **Level 3**: Triangle pyramid (15 blocks, centered).
  - **Level 4**: Scattered random blocks (15 blocks, spread out).
  - **Level 5**: Moving blocks (5 blocks oscillating horizontally, toughest).
- **Progression**: Clear all blocks to advance to the next level. Ball speed increases slightly each level.
- **Win/Game Over**: Win by clearing Level 5; game over if the ball passes the paddle.
- **Scoring**: Cumulative score across levels, saved high score in localStorage, rating (A-F) based on score.
- **Responsive**: Canvas scales to `min(90vw, 400px)` width, proportional height, with touch/mouse controls.
- **UI**: Neon-styled interface with gradient background, glowing paddle/ball, and Shadcn UI buttons (Start, Pause/Resume, Reset).

## Installation
1. **Clone the Repository** (or create a new folder):
   ```bash
   mkdir ping-pong-go
   cd ping-pong-go