/***********************************************************************************
 * SpaceGuard - Simple HTML5 Browser Game
 * 
 * Initialize the global sg object with the canvas id and the game will start 
 * running automatically. 
 * 
 * @license GPLv3
 * @link GitHub https://github.com/alextselegidis/SpaceGuard
 * @link Live http://alextselegidis.com/spaceguard
 * 
 * Version 1.0 
 * @task Power ups - shield and explosion
 * @task Add Score
 * @task Stats display
 * @task Display Menus
 * @taks Add sound
 * @task Add graphics
 * @task Adjust resolution for smooth animation
 **********************************************************************************/

// Global Constants
var SCALE = 0.5;
var CANVAS_WIDTH = 800;
var CANVAS_HEIGHT = 600;
var KEY_ESCAPE = 27;
var LOOP_DELAY = 10;

var SpaceGuard = function() {
    var inst = this;
    inst.canvas;
    inst.ctx;
    inst.cx; // center x & y
    inst.cy; 
    inst.guard = {
        x: undefined,
        y: undefined,
        width: 30 * SCALE,
        height: 30 * SCALE,
        shield: 100
    };
    inst.starship = {
        x: undefined,
        y: undefined,
        width: 100 * SCALE,
        height: 100 * SCALE,
        shield: 100
    };
    inst.commets;
    inst.frameUpdateTime = 1000 / 60; // 60 fps
    inst.lastUpdateTime; // last time canvas was updated
    inst.levelStartTime; // level start time - the player needs to survive for some minutes until the level is finished
    inst.level = 0;
    inst.score = 0;
    
    
    /**
     * The game must start with inst method.
     * @param {string} canvasId Canvas DOM element.
     * @returns {object} Returns game instance.
     */
    inst.initialize = function(canvasId) {
        inst.canvas = document.getElementById(canvasId);
        inst.ctx = inst.canvas.getContext('2d');
        // @task Adjust resolution of the canvas object so the client
        // displays smooth animation. Depending the adjustment percentage
        // all the elements of the game will need to scale down.
        inst.load();
        return inst;
    };

    /**
     * Loads needed resource files.
     * @returns {object} Returns game instance.
     */
    inst.load = function() {        
        // background
        inst.canvas.width = CANVAS_WIDTH * SCALE;
        inst.canvas.height = CANVAS_HEIGHT * SCALE;
        inst.cx = inst.canvas.width / 2;
        inst.cy = inst.canvas.height / 2; 
        inst.ctx.rect(0, 0, inst.canvas.width, inst.canvas.height);
        var gradient = inst.ctx.createRadialGradient(inst.cx, inst.cy, 400, inst.cx, inst.cy, 100);
        gradient.addColorStop(1, '#000');
        gradient.addColorStop(0, '#222');
        inst.ctx.fillStyle = gradient;
        inst.ctx.fill(); 

        // planet
        inst.ctx.beginPath();
        inst.ctx.arc(inst.cx, inst.cy, 80 * SCALE, 2 * Math.PI, false);
        gradient = inst.ctx.createLinearGradient(inst.cx, inst.cy, 30, 30);
        gradient.addColorStop(0, '#99547C');
        gradient.addColorStop(1, '#fff');
        inst.ctx.fillStyle = gradient;
        inst.ctx.fill();
        inst.ctx.lineWidth = 5 * SCALE;
        inst.ctx.strokeStyle = '#693A55';
        inst.ctx.stroke();

        // text
        inst.ctx.font = (30 * SCALE).toString() + 'pt helvetica';
        inst.ctx.textAlign = 'center';
        inst.ctx.fillStyle = '#fff';
        inst.ctx.fillText('Click to Start', inst.cx, inst.cy + 150 * SCALE);

        inst.canvas.addEventListener('click', inst.onClick, false);
        inst.canvas.addEventListener('contextmenu', inst.onContextMenu, false);

        return inst; 
    };

    /**
     * Game Loop
     * @returns {object} Returns game instance.
     */
    inst.game = function() {
        // init game vars
        inst.onGame = true;
        inst.onPause = false;
        inst.levelStartTime = new Date();
        inst.lastUpdateTime = new Date();
        inst.guard.x = inst.cx;
        inst.guard.y = inst.cy;
        inst.guard.shield = lvl[inst.level].guard.shield;
        inst.starship.x = inst.cx - (inst.starship.width / 2);
        inst.starship.y = inst.cy - (inst.starship.height / 2);
        inst.starship.shield = lvl[inst.level].starship.shield;
        
        // create commets
        inst.commets = [];
        for (var i = 0; i < 10; i++) {
            inst.commets.push(new Commet(inst));
            inst.commets[i].position();
        }

        // add event listeners
        inst.canvas.addEventListener('keyup', inst.onKeyUp);
        inst.canvas.addEventListener('mousemove', inst.onMouseMove);
        inst.canvas.addEventListener('mouseout', inst.onMouseOut);
        inst.canvas.style['cursor'] = 'none';

        // game loop
        inst.loop();

        return inst;
    };
    
    inst.drawBackground = function() {
        // space
        inst.cx = inst.canvas.width / 2;
        inst.cy = inst.canvas.height / 2; 
        inst.ctx.rect(0, 0, inst.canvas.width, inst.canvas.height);
        var gradient = inst.ctx.createRadialGradient(inst.cx, inst.cy, 400 * SCALE, inst.cx, inst.cy, 100);
        gradient.addColorStop(1, '#000');
        gradient.addColorStop(0, '#222');
        inst.ctx.fillStyle = gradient;
        inst.ctx.fill();

        // starship
        inst.ctx.beginPath();
        inst.ctx.rect(inst.starship.x, inst.starship.y, inst.starship.width, inst.starship.width);
        inst.ctx.fillStyle = '#C43355';
        inst.ctx.strokeStyle = '#7D283C';
        inst.ctx.lineWidth = 5 * SCALE;
        inst.ctx.fill();
        inst.ctx.stroke();
        inst.ctx.beginPath();
        inst.ctx.rect(inst.starship.x + (inst.starship.width / 2), inst.starship.x - (inst.starship.height / 2), inst.starship.width / 2, inst.starship.height / 2);
        inst.ctx.fillStyle = '#D94C6D';
        inst.ctx.strokeStyle = '#7D283C';
        inst.ctx.lineWidth = 5 * SCALE;
        inst.ctx.fill();
        inst.ctx.stroke();
    };

    inst.drawObjects = function() {
        // guard
        inst.ctx.beginPath();
        inst.ctx.rect(inst.guard.x - 15 * SCALE, inst.guard.y - 15 * SCALE, 30 * SCALE, 30 * SCALE);
        inst.ctx.fillStyle = 'yellow';
        inst.ctx.fill();

        // commets
        inst.commets.forEach(function(commet) {
            commet.draw();
            if (commet.collides(inst.guard)) {
                commet.destroyed = true;
                inst.guard.shield -= commet.damage / 4; // quarter damage for the shield
            }
            
            if (commet.collides(inst.starship)) {
                commet.destroyed = true;
                inst.starship.shield -= commet.damage;    
            }
            
            if (commet.destroyed) { // remove it from the array
                var index = inst.commets.indexOf(commet);
                if (index > -1) inst.commets.splice(index, 1);
            }
        });
        
        // create objects
        var rand = Math.floor(Math.random() * 1000) + 1;
        if (rand >= lvl[inst.level].commet.creationStep) {
            var commet = new Commet(inst);
            commet.position();
            inst.commets.push(commet);
        }
    };

    inst.pause = function() {
        if (!inst.onPause) {
            inst.canvas.style['cursor'] = 'none';
            inst.loop();
            return;
        }
        requestAnimationFrame(inst.pause, inst.canvas);
    };

    inst.loop = function() {
        if (inst.onPause) {
            inst.canvas.style['cursor'] = 'default';
            inst.pause();
            return;
        }

        if (!inst.onGame)  {
            inst.clearEventListeners();
            inst.onPause = false;
            inst.load(); // reset the game
            return;
        }

        if (inst.datediff(new Date(), inst.lastUpdateTime).ms > inst.frameUpdateTime) {
            // @task The game must run smoothly even in low power clients
            inst.drawBackground();
            inst.drawObjects(); 
            inst.lastUpdateTime = new Date();
        }            
        
        if (inst.guard.shield <= 0 || inst.starship.shield <= 0) {
            inst.onGame = false;
            console.log('shield destroyed', inst.guard.shield, inst.starship.shield);
        }
        
        if (inst.datediff(new Date(), inst.levelStartTime).minutes > lvl[inst.level].time) {
            inst.onGame = false;
            inst.level++;
            console.log('level completed - time is over - player survived');
        }

        requestAnimationFrame(inst.loop, inst.canvas);
    };

    inst.clearEventListeners = function() {
        inst.canvas.removeEventListener('click', inst.onClick, false);
        inst.canvas.removeEventListener('contextmenu', inst.onContextMenu, false);
        inst.canvas.removeEventListener('mousemove', inst.onMouseMove, false);
        inst.canvas.removeEventListener('mouseout', inst.onMouseOut, false);
        inst.canvas.removeEventListener('keyup', inst.onKeyUp, false);
    };

    inst.onMouseMove = function(e) {
        inst.guard.x = (e.x - inst.canvas.offsetLeft) * SCALE;
        inst.guard.y = (e.y - inst.canvas.offsetTop) * SCALE;
    };

    inst.onMouseOut = function(e) {
        inst.onPause = true;
    };

    inst.onClick = function(e) {
        if (!inst.onGame && !inst.onPause) inst.game();
    };

    inst.onKeyUp = function(e) {
        if (e.keyCode == KEY_ESCAPE && !inst.onPause) inst.onGame = false;
    };
    
    inst.onContextMenu = function(e) {
        if (inst.onGame && !inst.onPause) inst.onPause = true;
        else if (inst.onGame && inst.onPause) inst.onPause = false;
        e.preventDefault();
        return false;
    }
    
    inst.datediff = function(date1, date2) {
        // @link http://stackoverflow.com/a/7709819/1718162
        var diff = {};
        diff.ms = (date1 - date2);
        diff.days = Math.round(diff.ms / 86400000);
        diff.hours = Math.round((diff.ms % 86400000) / 3600000)
        diff.minutes = Math.round(((diff.ms % 86400000) % 3600000) / 60000); 
        return diff;
    };
};

/**
 * Handles the commets animation.
 * @param {object} sg SpaceGuard game instance.
 */
var Commet = function(sg) {
    var inst = this;
    inst.sg = sg;
    inst.x;
    inst.y;
    inst.width = 15 * SCALE;
    inst.height = 15 * SCALE;
    inst.speed = lvl[inst.sg.level].commet.speed;
    inst.damage = Math.floor(Math.random() * lvl[inst.sg.level].commet.damage);
    inst.dfs = 30 * SCALE; // initial distance from scene
    inst.dir;
    inst.destroyed = false;
    
    inst.position = function() {
        var canvasSide = Math.ceil(Math.random() * 4);

        switch(canvasSide) {
            case 1: // top
                inst.y = -1 * inst.dfs;
                inst.x = Math.ceil(Math.random() * sg.canvas.width);
                inst.dir = 1;
                break;
            case 2: // right
                inst.x = sg.canvas.width + inst.dfs;
                inst.y = Math.ceil(Math.random() * sg.canvas.height);
                inst.dir = -1;
                break;
            case 3:  // bottom
                inst.y = sg.canvas.height + inst.dfs;
                inst.x =  Math.ceil(Math.random() * sg.canvas.width);
                inst.dir = -1;
                break;
            case 4: // left
                inst.x = -1 * inst.dfs;
                inst.y = Math.ceil(Math.random() * sg.canvas.height);
                inst.dir = 1;
        }
    };

    inst.draw = function() {
        // move
        inst.x += inst.dir * Math.ceil(Math.random() * inst.speed) + 1;
        inst.y += inst.dir * Math.ceil(Math.random() * inst.speed) + 1;
        
        // draw
        inst.sg.ctx.beginPath();
        inst.sg.ctx.rect(inst.x, inst.y, inst.width, inst.height);
        inst.sg.ctx.fillStyle = 'red';
        inst.sg.ctx.fill();
    };

    /**
     * Check collision with object.
     * @param {object} obj{x, y, width, height
     * @returns {bool}
     */
    inst.collides = function(obj) {
        var cx, cy, cw, ch; // commet
        var ox, oy, ow, oh; // object
        
        cx = inst.x;
        cy = inst.y;
        cw = inst.width;
        ch = inst.height;
        
        ox = obj.x;
        oy = obj.y;
        ow = obj.width;
        oh = obj.height;
        
        // check whether objects collide
        if (((cx < ox && (cx + cw) > ox) 
                || (cx > ox && (cx + cw) < (ox + ow))
                || (cx > ox && cx < (ox + ow))) && 
            ((cy< oy && (cy + ch) > oy) 
                || (cy > oy && (cy + ch) < (oy + oh))
                || (cy > oy && cy < (oy + oh)))) {
            return true;
        } else {
            return false;
        }
    };
};

// Define global SpaceGuard object.
var sg = new SpaceGuard();

// Level Definition
var lvl = [
    {
        time: 2,
        background: 'img-path',
        guard: {
            shield: 100
        },
        starship: {
            shield: 100
        },
        commet: {
            speed: 4 * SCALE,
            damage: 2,
            creationStep: 850  // if higher less will be created
        }
    }
];