// Pixel Tactical Cow Game
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Disable anti-aliasing for pixel perfect rendering
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.webkitImageSmoothingEnabled = false;
        this.ctx.mozImageSmoothingEnabled = false;
        this.ctx.msImageSmoothingEnabled = false;
        
        this.width = 800;
        this.height = 600;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        this.gameState = 'playing'; // playing, paused, gameOver
        this.score = 0;
        this.wave = 1;
        this.enemiesKilled = 0;
        
        // Game objects
        this.player = new Player(this.width / 2, this.height / 2);
        this.enemies = [];
        this.bullets = [];
        this.particles = [];
        
        // Game timing
        this.enemySpawnTimer = 0;
        this.enemySpawnRate = 180; // frames between spawns
        this.waveTimer = 0;
        
        // Input handling
        this.keys = {};
        this.mouse = { x: 0, y: 0, pressed: false };
        
        this.setupInput();
        this.setupUI();
        this.spawnInitialEnemies();
        
        // Start game loop
        this.gameLoop();
    }
    
    setupInput() {
        // Keyboard input
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            // Handle special keys
            if (e.code === 'Escape') {
                this.togglePause();
            } else if (e.code === 'Digit1') {
                this.player.switchWeapon(0);
            } else if (e.code === 'Digit2') {
                this.player.switchWeapon(1);
            } else if (e.code === 'Digit3') {
                this.player.switchWeapon(2);
            } else if (e.code === 'KeyR') {
                this.player.reload();
            }
            
            e.preventDefault();
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            e.preventDefault();
        });
        
        // Mouse input
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = (e.clientX - rect.left) * (this.width / rect.width);
            this.mouse.y = (e.clientY - rect.top) * (this.height / rect.height);
        });
        
        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Left click
                this.mouse.pressed = true;
            }
        });
        
        this.canvas.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.mouse.pressed = false;
            }
        });
        
        // Prevent context menu
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    setupUI() {
        // Wait for DOM to be ready and setup event listeners
        const resumeBtn = document.getElementById('resumeBtn');
        const restartBtn = document.getElementById('restartBtn');
        
        if (resumeBtn) {
            resumeBtn.addEventListener('click', () => {
                this.togglePause();
            });
        }
        
        if (restartBtn) {
            restartBtn.addEventListener('click', () => {
                this.restart();
            });
        }
    }
    
    togglePause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            const gameOverlay = document.getElementById('gameOverlay');
            const overlayTitle = document.getElementById('overlayTitle');
            const overlayMessage = document.getElementById('overlayMessage');
            
            if (gameOverlay) gameOverlay.classList.remove('hidden');
            if (overlayTitle) overlayTitle.textContent = 'Game Paused';
            if (overlayMessage) overlayMessage.textContent = 'Press ESC to resume';
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
            const gameOverlay = document.getElementById('gameOverlay');
            if (gameOverlay) gameOverlay.classList.add('hidden');
        }
    }
    
    spawnInitialEnemies() {
        for (let i = 0; i < 3; i++) {
            this.spawnRandomEnemy();
        }
    }
    
    spawnRandomEnemy() {
        const side = Math.floor(Math.random() * 4); // 0=top, 1=right, 2=bottom, 3=left
        let x, y;
        
        switch (side) {
            case 0: // top
                x = Math.random() * this.width;
                y = -50;
                break;
            case 1: // right
                x = this.width + 50;
                y = Math.random() * this.height;
                break;
            case 2: // bottom
                x = Math.random() * this.width;
                y = this.height + 50;
                break;
            case 3: // left
                x = -50;
                y = Math.random() * this.height;
                break;
        }
        
        const enemyType = Math.floor(Math.random() * 3);
        switch (enemyType) {
            case 0:
                this.enemies.push(new BasicEnemy(x, y));
                break;
            case 1:
                this.enemies.push(new FastEnemy(x, y));
                break;
            case 2:
                this.enemies.push(new TankEnemy(x, y));
                break;
        }
    }
    
    handleInput() {
        if (this.gameState !== 'playing') return;
        
        // Player movement
        let moveX = 0, moveY = 0;
        if (this.keys['KeyW'] || this.keys['ArrowUp']) moveY -= 1;
        if (this.keys['KeyS'] || this.keys['ArrowDown']) moveY += 1;
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveX -= 1;
        if (this.keys['KeyD'] || this.keys['ArrowRight']) moveX += 1;
        
        this.player.move(moveX, moveY);
        
        // Player shooting
        if (this.mouse.pressed) {
            const angle = Math.atan2(this.mouse.y - this.player.y, this.mouse.x - this.player.x);
            const bullet = this.player.shoot(angle);
            if (bullet) {
                this.bullets.push(bullet);
                this.playSound('shoot');
            }
        }
    }
    
    update() {
        if (this.gameState !== 'playing') return;
        
        this.handleInput();
        
        // Update player
        this.player.update(this.width, this.height);
        
        // Update bullets
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            this.bullets[i].update();
            
            // Remove bullets that are off screen
            const bullet = this.bullets[i];
            if (bullet.x < -50 || bullet.x > this.width + 50 || 
                bullet.y < -50 || bullet.y > this.height + 50) {
                this.bullets.splice(i, 1);
            }
        }
        
        // Update enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(this.player);
            
            // Enemy shooting
            const enemyBullet = enemy.shoot(this.player);
            if (enemyBullet) {
                this.bullets.push(enemyBullet);
            }
        }
        
        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (this.particles[i].life <= 0) {
                this.particles.splice(i, 1);
            }
        }
        
        this.checkCollisions();
        this.spawnEnemies();
        this.updateUI();
    }
    
    checkCollisions() {
        // Player bullets vs enemies
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            if (bullet.type !== 'player') continue;
            
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                if (this.isColliding(bullet, enemy)) {
                    // Hit enemy
                    enemy.takeDamage(bullet.damage);
                    this.bullets.splice(i, 1);
                    
                    // Create hit particles
                    this.createHitParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
                    
                    if (enemy.health <= 0) {
                        this.score += enemy.points;
                        this.enemiesKilled++;
                        this.enemies.splice(j, 1);
                        this.playSound('enemyDeath');
                        
                        // Create death particles
                        this.createDeathParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
                    } else {
                        this.playSound('hit');
                    }
                    break;
                }
            }
        }
        
        // Enemy bullets vs player
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            if (bullet.type !== 'enemy') continue;
            
            if (this.isColliding(bullet, this.player)) {
                this.player.takeDamage(bullet.damage);
                this.bullets.splice(i, 1);
                this.playSound('playerHit');
                
                if (this.player.health <= 0) {
                    this.gameOver();
                }
            }
        }
        
        // Player vs enemies (collision damage)
        for (const enemy of this.enemies) {
            if (this.isColliding(this.player, enemy)) {
                this.player.takeDamage(10);
                this.playSound('playerHit');
                
                // Push player away
                const dx = this.player.x - enemy.x;
                const dy = this.player.y - enemy.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance > 0) {
                    this.player.x += (dx / distance) * 20;
                    this.player.y += (dy / distance) * 20;
                }
                
                if (this.player.health <= 0) {
                    this.gameOver();
                }
                break;
            }
        }
    }
    
    isColliding(obj1, obj2) {
        return obj1.x < obj2.x + obj2.width &&
               obj1.x + obj1.width > obj2.x &&
               obj1.y < obj2.y + obj2.height &&
               obj1.y + obj1.height > obj2.y;
    }
    
    spawnEnemies() {
        this.enemySpawnTimer++;
        if (this.enemySpawnTimer >= this.enemySpawnRate) {
            this.enemySpawnTimer = 0;
            
            // Don't spawn too many enemies
            if (this.enemies.length < 8) {
                this.spawnRandomEnemy();
            }
        }
        
        // Increase difficulty over time
        this.waveTimer++;
        if (this.waveTimer >= 1800) { // 30 seconds at 60fps
            this.waveTimer = 0;
            this.wave++;
            this.enemySpawnRate = Math.max(60, this.enemySpawnRate - 20);
        }
    }
    
    createHitParticles(x, y) {
        for (let i = 0; i < 5; i++) {
            this.particles.push(new Particle(x, y, '#ff0000', 20));
        }
    }
    
    createDeathParticles(x, y) {
        for (let i = 0; i < 10; i++) {
            this.particles.push(new Particle(x, y, '#ffaa00', 40));
        }
    }
    
    updateUI() {
        const healthText = document.getElementById('healthText');
        const ammoText = document.getElementById('ammoText');
        const scoreText = document.getElementById('scoreText');
        const weaponName = document.getElementById('weaponName');
        
        if (healthText) healthText.textContent = Math.max(0, this.player.health);
        if (ammoText) ammoText.textContent = this.player.getCurrentWeapon().ammo;
        if (scoreText) scoreText.textContent = this.score;
        if (weaponName) weaponName.textContent = this.player.getCurrentWeapon().name;
        
        // Update health bar
        const healthFill = document.getElementById('healthFill');
        if (healthFill) {
            const healthPercent = Math.max(0, (this.player.health / 100) * 100);
            healthFill.style.width = healthPercent + '%';
            
            healthFill.className = 'pixel-health-fill';
            if (healthPercent <= 30) {
                healthFill.classList.add('low');
            } else if (healthPercent <= 60) {
                healthFill.classList.add('medium');
            }
        }
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        const gameOverlay = document.getElementById('gameOverlay');
        const overlayTitle = document.getElementById('overlayTitle');
        const overlayMessage = document.getElementById('overlayMessage');
        
        if (gameOverlay) gameOverlay.classList.remove('hidden');
        if (overlayTitle) overlayTitle.textContent = 'Game Over';
        if (overlayMessage) overlayMessage.textContent = `Final Score: ${this.score}`;
    }
    
    restart() {
        console.log('Restarting game...'); // Debug log
        
        // Reset game state
        this.gameState = 'playing';
        this.score = 0;
        this.wave = 1;
        this.enemiesKilled = 0;
        this.enemySpawnTimer = 0;
        this.enemySpawnRate = 180;
        this.waveTimer = 0;
        
        // Reset game objects
        this.player = new Player(this.width / 2, this.height / 2);
        this.enemies = [];
        this.bullets = [];
        this.particles = [];
        
        // Hide overlay
        const gameOverlay = document.getElementById('gameOverlay');
        if (gameOverlay) {
            gameOverlay.classList.add('hidden');
        }
        
        // Spawn initial enemies
        this.spawnInitialEnemies();
        
        // Update UI immediately
        this.updateUI();
        
        console.log('Game restarted successfully'); // Debug log
    }
    
    playSound(type) {
        // Simple audio context beeps for retro feel
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            let frequency = 440;
            let duration = 0.1;
            
            switch (type) {
                case 'shoot':
                    frequency = 800;
                    duration = 0.05;
                    break;
                case 'hit':
                    frequency = 300;
                    duration = 0.1;
                    break;
                case 'enemyDeath':
                    frequency = 150;
                    duration = 0.2;
                    break;
                case 'playerHit':
                    frequency = 200;
                    duration = 0.3;
                    break;
            }
            
            oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
            oscillator.type = 'square';
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration);
        } catch (e) {
            // Audio not supported, continue silently
        }
    }
    
    render() {
        // Clear screen with pixelated background
        this.ctx.fillStyle = '#001122';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw pixelated grid background
        this.ctx.strokeStyle = '#002244';
        this.ctx.lineWidth = 1;
        for (let x = 0; x < this.width; x += 40) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();
        }
        for (let y = 0; y < this.height; y += 40) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }
        
        // Render game objects
        this.player.render(this.ctx);
        
        for (const enemy of this.enemies) {
            enemy.render(this.ctx);
        }
        
        for (const bullet of this.bullets) {
            bullet.render(this.ctx);
        }
        
        for (const particle of this.particles) {
            particle.render(this.ctx);
        }
        
        // Render wave info
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '16px monospace';
        this.ctx.fillText(`Wave: ${this.wave}`, 10, 30);
        this.ctx.fillText(`Enemies: ${this.enemies.length}`, 10, 50);
    }
    
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Player class with pixelated cow
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 32;
        this.height = 32;
        this.health = 100;
        this.maxHealth = 100;
        this.speed = 3;
        this.invulnerable = 0;
        
        // Weapons system
        this.weapons = [
            { name: 'Milk Pistol', damage: 25, fireRate: 20, ammo: 12, maxAmmo: 12, reloadTime: 60 },
            { name: 'Hay Rifle', damage: 40, fireRate: 10, ammo: 30, maxAmmo: 30, reloadTime: 90 },
            { name: 'Cheese Blaster', damage: 60, fireRate: 50, ammo: 8, maxAmmo: 8, reloadTime: 120 }
        ];
        this.currentWeapon = 0;
        this.shootCooldown = 0;
        this.reloading = 0;
    }
    
    move(dx, dy) {
        // Normalize diagonal movement
        if (dx !== 0 && dy !== 0) {
            dx *= 0.707;
            dy *= 0.707;
        }
        
        this.x += dx * this.speed;
        this.y += dy * this.speed;
    }
    
    update(screenWidth, screenHeight) {
        // Keep player on screen
        this.x = Math.max(8, Math.min(this.x, screenWidth - this.width - 8));
        this.y = Math.max(8, Math.min(this.y, screenHeight - this.height - 8));
        
        // Update timers
        if (this.shootCooldown > 0) this.shootCooldown--;
        if (this.invulnerable > 0) this.invulnerable--;
        if (this.reloading > 0) this.reloading--;
    }
    
    shoot(angle) {
        const weapon = this.getCurrentWeapon();
        
        if (this.shootCooldown <= 0 && weapon.ammo > 0 && this.reloading <= 0) {
            this.shootCooldown = weapon.fireRate;
            weapon.ammo--;
            
            const speed = 8;
            const bulletX = this.x + this.width / 2;
            const bulletY = this.y + this.height / 2;
            const dx = Math.cos(angle) * speed;
            const dy = Math.sin(angle) * speed;
            
            return new Bullet(bulletX, bulletY, dx, dy, weapon.damage, 'player');
        }
        return null;
    }
    
    reload() {
        const weapon = this.getCurrentWeapon();
        if (weapon.ammo < weapon.maxAmmo && this.reloading <= 0) {
            this.reloading = weapon.reloadTime;
            weapon.ammo = weapon.maxAmmo;
        }
    }
    
    switchWeapon(index) {
        if (index >= 0 && index < this.weapons.length) {
            this.currentWeapon = index;
        }
    }
    
    getCurrentWeapon() {
        return this.weapons[this.currentWeapon];
    }
    
    takeDamage(damage) {
        if (this.invulnerable <= 0) {
            this.health -= damage;
            this.invulnerable = 60; // 1 second at 60fps
        }
    }
    
    render(ctx) {
        // Flash when invulnerable
        if (this.invulnerable > 0 && Math.floor(this.invulnerable / 5) % 2) {
            return;
        }
        
        // Draw pixelated cow
        const pixelSize = 4;
        
        // Cow body (white with black spots)
        ctx.fillStyle = '#ffffff';
        this.drawPixelRect(ctx, this.x + 4, this.y + 8, 24, 20, pixelSize);
        
        // Black spots
        ctx.fillStyle = '#000000';
        this.drawPixelRect(ctx, this.x + 8, this.y + 12, 4, 4, pixelSize);
        this.drawPixelRect(ctx, this.x + 20, this.y + 16, 4, 4, pixelSize);
        this.drawPixelRect(ctx, this.x + 12, this.y + 20, 4, 4, pixelSize);
        
        // Cow head (white)
        ctx.fillStyle = '#ffffff';
        this.drawPixelRect(ctx, this.x + 8, this.y, 16, 12, pixelSize);
        
        // Pink nose
        ctx.fillStyle = '#ff69b4';
        this.drawPixelRect(ctx, this.x + 12, this.y + 8, 8, 4, pixelSize);
        
        // Eyes
        ctx.fillStyle = '#000000';
        this.drawPixelRect(ctx, this.x + 8, this.y + 4, 2, 2, pixelSize);
        this.drawPixelRect(ctx, this.x + 18, this.y + 4, 2, 2, pixelSize);
        
        // Legs
        ctx.fillStyle = '#000000';
        this.drawPixelRect(ctx, this.x + 8, this.y + 28, 4, 4, pixelSize);
        this.drawPixelRect(ctx, this.x + 16, this.y + 28, 4, 4, pixelSize);
        this.drawPixelRect(ctx, this.x + 20, this.y + 28, 4, 4, pixelSize);
        
        // Tail
        ctx.fillStyle = '#000000';
        this.drawPixelRect(ctx, this.x + 28, this.y + 16, 2, 8, pixelSize);
        
        // Reloading indicator
        if (this.reloading > 0) {
            ctx.fillStyle = '#ffff00';
            ctx.font = '12px monospace';
            ctx.fillText('RELOADING', this.x - 10, this.y - 10);
        }
    }
    
    drawPixelRect(ctx, x, y, width, height, pixelSize) {
        for (let px = 0; px < width; px += pixelSize) {
            for (let py = 0; py < height; py += pixelSize) {
                ctx.fillRect(x + px, y + py, pixelSize, pixelSize);
            }
        }
    }
}

// Enemy classes
class BasicEnemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 24;
        this.height = 24;
        this.health = 50;
        this.maxHealth = 50;
        this.speed = 1.5;
        this.points = 10;
        this.shootCooldown = 0;
        this.color = '#ff4444';
    }
    
    update(player) {
        // Move towards player
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            this.x += (dx / distance) * this.speed;
            this.y += (dy / distance) * this.speed;
        }
        
        if (this.shootCooldown > 0) this.shootCooldown--;
    }
    
    shoot(player) {
        if (this.shootCooldown <= 0) {
            const distance = Math.sqrt((player.x - this.x) ** 2 + (player.y - this.y) ** 2);
            if (distance < 200) {
                this.shootCooldown = 120;
                
                const angle = Math.atan2(player.y - this.y, player.x - this.x);
                const speed = 4;
                const dx = Math.cos(angle) * speed;
                const dy = Math.sin(angle) * speed;
                
                return new Bullet(this.x + this.width / 2, this.y + this.height / 2, dx, dy, 15, 'enemy');
            }
        }
        return null;
    }
    
    takeDamage(damage) {
        this.health -= damage;
    }
    
    render(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Eyes
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(this.x + 4, this.y + 6, 4, 4);
        ctx.fillRect(this.x + 16, this.y + 6, 4, 4);
        
        // Health bar
        if (this.health < this.maxHealth) {
            ctx.fillStyle = '#000000';
            ctx.fillRect(this.x, this.y - 8, this.width, 4);
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(this.x + 1, this.y - 7, (this.width - 2) * (this.health / this.maxHealth), 2);
        }
    }
}

class FastEnemy extends BasicEnemy {
    constructor(x, y) {
        super(x, y);
        this.speed = 2.5;
        this.health = 30;
        this.maxHealth = 30;
        this.points = 15;
        this.color = '#44ff44';
        this.width = 20;
        this.height = 20;
    }
}

class TankEnemy extends BasicEnemy {
    constructor(x, y) {
        super(x, y);
        this.speed = 0.8;
        this.health = 100;
        this.maxHealth = 100;
        this.points = 25;
        this.color = '#4444ff';
        this.width = 32;
        this.height = 32;
    }
}

// Bullet class
class Bullet {
    constructor(x, y, dx, dy, damage, type) {
        this.x = x;
        this.y = y;
        this.dx = dx;
        this.dy = dy;
        this.width = 4;
        this.height = 4;
        this.damage = damage;
        this.type = type; // 'player' or 'enemy'
    }
    
    update() {
        this.x += this.dx;
        this.y += this.dy;
    }
    
    render(ctx) {
        ctx.fillStyle = this.type === 'player' ? '#ffff00' : '#ff0000';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Bullet trail
        ctx.fillStyle = this.type === 'player' ? '#ffff0066' : '#ff000066';
        ctx.fillRect(this.x - this.dx / 2, this.y - this.dy / 2, this.width / 2, this.height / 2);
    }
}

// Particle class for effects
class Particle {
    constructor(x, y, color, life) {
        this.x = x;
        this.y = y;
        this.dx = (Math.random() - 0.5) * 8;
        this.dy = (Math.random() - 0.5) * 8;
        this.color = color;
        this.life = life;
        this.maxLife = life;
        this.size = Math.random() * 4 + 2;
    }
    
    update() {
        this.x += this.dx;
        this.y += this.dy;
        this.dx *= 0.95;
        this.dy *= 0.95;
        this.life--;
    }
    
    render(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.globalAlpha = 1;
    }
}

// Global game instance
let game;

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    game = new Game();
});