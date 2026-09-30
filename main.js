
const [WIDTH, HEIGHT, SCALE] = (() => {

	const [EXPECTED_WIDTH, EXPECTED_HEIGHT] = [1200, 800];
	const ASPECT_RATIO = EXPECTED_WIDTH/EXPECTED_HEIGHT;

	const padding = 20;

	// Source - https://stackoverflow.com/a/8876069
	// Posted by ryanve, modified by community. See post 'Timeline' for change history
	// Retrieved 2026-09-27, License - CC BY-SA 4.0

	// Get viewport WIDTH and HEIGHT
	let vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0) - padding * 2;
	let vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0) - padding * 2;

	// Scale the vh so that it would be equal to hw if they had the desired aspect ratio
	let scaledVH = vh * ASPECT_RATIO;

	// Find out which dimension is the constraining one;
	let min = Math.min(vw, scaledVH);

	if (min === vw) {
		return [vw, vw / ASPECT_RATIO, vw/EXPECTED_WIDTH];
	} else {
		return [vh * ASPECT_RATIO, vh, vh/EXPECTED_HEIGHT];
	}
})();

const colors = {
	darkBlack: color(10, 5, 5),
	black: color(25, 20, 20),
	lightBlack: color(35, 25, 25),
	white: color(200),
};

let click = false;
let keys = {};

let score = 0;
let lives = 3;

const copyObj = obj => JSON.parse(JSON.stringify(obj));

const images = (() => {

	const images = {

	};

	return images;
})();

const Vector = (() => {

	class Vector {
		constructor (x = 0, y = 0, z = 0) {
			this.x = x;
			this.y = y;
			this.z = z;
		}

		add (v, y, z) {
			if (y == null || z == null) return new Vector(this.x + v.x, this.y + v.y, this.z + v.z);
			else return new Vector(this.x + v, this.y + y, this.z + z);
		}

		sub (v, y, z) {
			if (y == null || z == null) return new Vector(this.x - v.x, this.y - v.y, this.z - v.z);
			else return new Vector(this.x - v, this.y - y, this.z - z);
		}

		mult (s) {
			return new Vector(this.x * s, this.y * s, this.z * s);
		}

		div (s) {
			return this.mult(1/s);
		}

		toString () {
			return `x: ${this.x}, y: ${this.y}, z: ${this.z}`
		}
	}

	return Vector
})();

const player = (() => {

	const calculateTopSpeed = (speed, drag) => (speed * drag) / (1 - drag)

	class Player {
		constructor (config = {}) {
			this.config = config;
			this.reset();
		}

		get x () {
			return this.position.x;
		}

		get y () {
			return this.position.y;
		}

		reset () {
			
			const config = this.config;

			this.position = new Vector(config.x ?? 0, config.y ?? 0);
			this.velocity = new Vector();

			this.width = config.width ?? 20 * SCALE;
			this.height = config.height ?? 20 * SCALE;

			this.speed = config.speed ?? 6 * SCALE;
			this.drag = config.drag ?? 0.6;

			this.topSpeed = calculateTopSpeed(this.speed, this.drag);

			this.angle = 0;
			this.maxAngle = PI/40;
		}

		run (data) {
			this.update(data);
			this.display(data);
		}

		handleMovement (keys) {
			if (keys.a || keys.arrowleft) this.velocity.x -= this.speed;
			if (keys.d || keys.arrowright) this.velocity.x += this.speed;
		}

		applyVelocity () {
			this.position = this.position.add(this.velocity);
		}

		applyDrag () {
			this.velocity = this.velocity.mult(this.drag);
		}

		handleAngle () {
			this.angle = this.maxAngle * this.velocity.x / this.topSpeed;
		}

		update (data) {
			this.handleMovement(data.keys);
			this.applyVelocity();
			this.applyDrag();
			this.handleAngle();
		}

		display () {
			push();

			translate(this.x, this.y);
			rotate(this.angle);

			noStroke();
			fill(colors.white);
			rect(-this.width/2, -this.height/2, this.width, this.height);

			pop();
		}
	}

	return new Player({
		x: 600 * SCALE,
		y: 760 * SCALE,
		width: 200 * SCALE,
		height: 40 * SCALE,
	});
})();

const ball = (() => {

	const AABB = (a, b) => a.x + a.width  / 2 > b.x - b.width  / 2 &&
						   b.x + b.width  / 2 > a.x - a.width  / 2 && 
						   a.y + a.height / 2 > b.y - b.height / 2 &&
						   b.y + b.height / 2 > a.y - a.height / 2;

	class Ball {
		constructor (config) {
			this.position = new Vector(config.x ?? 0, config.y ?? 0);
			this.lastX = this.position.x;
			this.lastY = this.position.y;
			this.velocity = new Vector();

			this.size = 20 * SCALE;
			this.speed = 10 * SCALE;
		}

		get x () {
			return this.position.x;
		}

		get y () {
			return this.position.y;
		}

		get width () {
			return this.size;
		}

		get height () {
			return this.size;
		}

		run (data) {
			this.update(data);
			this.display();
		}

		reset () {
			this.position.x = WIDTH / 2;
			this.position.y = HEIGHT / 2;

			this.hitBottom = false;

			this.startInRandomDirection();
		}

		startInRandomDirection () {
			const angle = Math.random() * -PI/2 - PI/4;

			this.velocity.x = cos(angle) * this.speed;
			this.velocity.y = sin(angle) * this.speed; 
		}

		bounceOffEdges () {
			
			const s = this.size/2;

			let [xs, xb, ys, yb] = [
				this.position.x - s < 0,
				this.position.x + s > WIDTH,
				this.position.y - s < 0,
				this.position.y + s > HEIGHT
			];

			if (xs || xb) this.velocity.x *= -1;
			if (ys || yb) this.velocity.y *= -1;

			if (xs) this.position.x = s;
			if (xb) this.position.x = WIDTH - s;
			if (ys) this.position.y = s;
			if (yb) this.position.y = HEIGHT - s;

			// Loose a life
			if (yb) this.hitBottom = true;
		}

		setVelForAngle (angle) {
			this.velocity.x = cos(angle) * this.speed;
			this.velocity.y = sin(angle) * this.speed;
		}

		bounceOffBox (box) {
			// Only continue if we are colliding
			if (!AABB(this, box)) return false;

			let bounce = {};

			// Bounce off of top
			if (this.lastY + this.size/2 < box.y - box.height/2) {
				this.position.y = box.y - box.height/2 - this.size/2;
				this.velocity.y *= -1;
				bounce.top = true;
			}

			// Bounce off of bottom
			if (this.lastY - this.size/2 > box.y + box.height/2) {
				this.position.y = box.y + box.height/2 + this.size/2;
				this.velocity.y *= -1;
				bounce.bottom = true;
			}

			// Bounce off of left
			if (this.lastX + this.size/2 < box.x - box.width/2) {
				this.position.x = box.x - box.width/2 - this.size/2;
				this.velocity.x *= -1;
				bounce.left = true;
			}

			// Bounce off of right
			if (this.lastX - this.size/2 > box.x + box.width/2) {
				this.position.x = box.x + box.width/2 + this.size/2;
				this.velocity.x *= -1;
				bounce.right = true;
			}

			return bounce;
		}

		bounceOffPlayer (player) {
			const res = this.bounceOffBox(player);

			if (res && res.top) {
				const curAngle = Math.atan2(this.velocity.y, this.velocity.x);

				if (player.velocity.x > 0.2) this.setVelForAngle(Math.min(curAngle + PI/20, -PI/8));
				else if (player.velocity.x < 0.2) this.setVelForAngle(Math.max(curAngle - PI/20, -7 * PI/8));
			}
		}
		
		bounceOffBricks (bricks) {
			for (const i of bricks.bricks) {
				if (this.bounceOffBox(i) && !i.dead) {
					i.dead = true;
					score += i.level * 50 + 50;
				}
			}
		}

		applyVelocity () {
			this.lastX = this.position.x;
			this.lastY = this.position.y;
			this.position = this.position.add(this.velocity);
		}

		update (data) {
			this.applyVelocity();
			this.bounceOffEdges();
			this.bounceOffPlayer(data.player);
			this.bounceOffBricks(data.bricks);
		}

		display () {
			push();
			noStroke();
			fill(colors.white);
			rect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
			pop();
		}
	}

	return new Ball({x: WIDTH/2, y: HEIGHT/2 });
})();

const bricks = (() => {

	const brickColors = [color(59, 133, 75), color(236, 196, 68), color(202, 66, 62), color(87, 132, 230)];

	const brickWidth = 109 * SCALE;
	const brickHeight = 50 * SCALE;
	const brickGap = 10 * SCALE;

	class Brick {
		constructor (config) {
			this.x = config.x ?? 0;
			this.y = config.y ?? 0;
			this.width = config.width ?? brickWidth;
			this.height = config.height ?? brickHeight;

			this.level = config.level ?? 0;
			this.dead = false;
		}

		run () {
			this.display();
			return this.dead;
		}

		display () {
			push();

			noStroke();
			fill(brickColors[this.level]);

			rect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);

			pop();
		}
	}

	const bricks = {
		bricks: [],

		run () {
			for (var i = this.bricks.length - 1; i >= 0; i--) {
				if (this.bricks[i].run()) this.bricks.splice(i, 1);
			}
		},

		add (config) {
			this.bricks.push(new Brick(config));
		},

		clear () {
			this.bricks = [];
		},

		reset () {
			this.clear();

			const maxBricks = WIDTH / (brickWidth + brickGap + 1) - 1;

			for (let i = 0; i < 4; i ++) {
				
				let y = (i + 1.5) * (brickHeight + brickGap) + brickGap + brickHeight/2;

				for (let j = 0; j < maxBricks; j ++) {

					let x = j * (brickWidth + brickGap) + brickGap + brickWidth/2;

					this.add({ x, y, level: 3 - i})
				}
			}
		},
	};

	return bricks;
})();

const scenes = (() => {

	const sceneAfterLoading = "play";
	
	let nextTransitionData = { transition: false };

	function resetTransitionData (data) {
		data.transition = false;
		data.to = null;
		data.getImage = null;
		data.image = null;
		data.speed = null;
		data.type = null;
	}
	
	// Let the buttons know if they need to be displayed during the transition
	let nextScene = null;

	let currentScene = "loading";

	const defaults = {
		transitionType: "slide",
		transitionSpeed: 1,
		transitionGetImage: get,

		colors: {
			transition: color(220),
			loading: {
				background: color(240),
				text: color(20),
			}
		}
	};

	const scenes = {

		// Use getters to only allow read only access
		get currentScene () {
			return currentScene;
		},

		get nextScene () {
			return nextScene;
		},

		get defaults () {
			return defaults;
		},

		setDefault (property, value) {
			const split = property.split(".");

			let current = defaults[split[0]];
			for (let i = 1; i < split.length - 1; i ++) current = current[split[i]];

			current[split[split.length - 1]] = value;
			return value;
		},

		run (deltaTime) {
			this[currentScene]({ deltaTime }); // run the current scene

			click = false;

			if (nextTransitionData.transition) {

				// Capture the image of the canvas at the end of the frame so that everythin is drawn
				if (nextTransitionData.getImage) nextTransitionData.image = nextTransitionData.getImage();

				this.runTransition({ deltaTime, transitionData: nextTransitionData });
			};
		},

		transition: (() => {
			return function (data) {
				const dataOut = nextTransitionData;
				
				if (data.to != null) dataOut.to = data.to;
				else throw "data.to is required";

				if (data.getImage != null) dataOut.getImage = data.getImage;
				else if (data.image != null) dataOut.image = data.image;
				else dataOut.getImage = scenes.defaults.transitionGetImage;

				dataOut.speed = data.speed ?? scenes.defaults.transitionSpeed;
				
				dataOut.type = data.type ?? scenes.defaults.transitionType;

				dataOut.color = data.color ?? scenes.defaults.colors.transition;

				dataOut.transition = true;
			}			
		})(),
	
		runTransition: (() => {

			let amt = 0;
			let data;

			const transitionFunctions = (() => {
				const anim1 = x => 4 *(x - 0.5) ** 3 + 0.5;

				return { 

					functions: {
						slide (amt, color) {
							fill(color);
							noStroke();
							rect(-WIDTH + WIDTH * anim1(amt) * 2, 0, WIDTH, HEIGHT);
						},

						wait (amt, color) {
							let newAmt = amt < 0.4 ? 0 : (amt - 0.4) * 1.666667;
							this.slide(newAmt, color);
						},
					},

					midPoints: {
						slide: 0.5,
						wait: 0.7,
					}
				};
			})();

			const resetData = (() => {

				function copyData (data) {
					const result = {};

					for (const i in data) {

						// Copy everything except for getImage
						if (i === "getImage") continue;

						result[i] = data[i];
					}

					return result;
				}

				return function (_data) {

					// Reset data for the transition
					amt = 0;
					data = copyData(_data);
					nextScene = data.to;
					currentScene = "runTransition";

					// Validate data
					const validated = validateData(data);
					if (!validated.success) throw validated.errors.join(", ");

					// Don't try to transition twice
					resetTransitionData(nextTransitionData);
				}
			})();

			const validateData = (() => {

				return function (data) {

					const errors = [];

					if (typeof data.to !== "string") errors.push("invalid data.to");

					if (typeof data.image !== "object") errors.push("invalid data.image");

					if (typeof data.speed !== "number") errors.push("invalid data.speed");

					if (typeof data.type !== "string") errors.push("invalid data.type");

					if (!Object.keys(transitionFunctions.functions).includes(data.type)) errors.push("invalid data.type");

					if (errors.length === 0) return { success: true };
					else return { errors };
				}
			})();

			const handleScene = (() => {
				return function (amt, data) {
					
					// Display image from last scene
					if (amt < transitionFunctions.midPoints[data.type] ?? 0.5) image(data.image, 0, 0, WIDTH, HEIGHT);

					// Run the next scene
					else if (amt < 1) scenes[data.to]();
					
					// Switch to next scene
					else currentScene = data.to;
				}
			})();

			const displayTransition = (() => {

				return function (amt, data) {

					push();

					const functions = transitionFunctions.functions;

					for (const i in functions) if (data.type === i) {
						functions[i](amt, data.color);
						break;
					}

					pop();
				}
			})();

			function changeInAmt(dt, speed) {
				return dt/1000/speed;
			}
	
			return function (_data) {
	
				if (_data.transitionData) resetData(_data.transitionData);

				amt += changeInAmt(_data.deltaTime ?? 17, data?.speed ?? 1);

				handleScene(amt, data);
			
				displayTransition(amt, data);
			}
		})(),
	
		loading: (() => {
			
			// Convert image functions into image objects and return the progress of the loading
			const convertImages = (() => {
				
				let keys = Object.keys(images);
				let curInd = 0;
				let maxInd = keys.length;

				return function () {

					// Calculate the progress and return early if already done
					const progress = (curInd + 1)/maxInd;
					if (progress > 1) return progress;
					
					// replace the functions in the image objects with what they return
					const imageName = keys[curInd];
					if (images[imageName]) images[imageName] = images[imageName]();	

					curInd ++;

					return progress;
				}
			})();

			const displayLoadingProgress = (() => {

				function displayCircle (progress) {
					noFill();

					strokeWeight(15 * SCALE);
					stroke(scenes.defaults.colors.loading.text);

					let offset = PI/2 + progress * 0.9 * PI * 2;
					let circleProgress = 2 * PI * progress
					arc(WIDTH/2, HEIGHT/2.5, 200 * SCALE, 200 * SCALE, offset, circleProgress + offset);
				}

				function displayText (progress) {
					textAlign(CENTER, CENTER);
					textSize(100 * SCALE);
					textFont('Anton');

					fill(scenes.defaults.colors.loading.text);
					noStroke();

					text(`Loading: ${Math.round(progress * 100)}%`, WIDTH/2, HEIGHT/1.5);
				}

				return function (progress) {
					push();

					displayCircle(progress);
					displayText(progress);

					pop();
				}
			})();

			function handleTransition (progress) {
				if (progress >= 1) scenes.transition({ to: sceneAfterLoading });
			}
	
			return function () {

				push();
				
				background(scenes.defaults.colors.loading.background);

				const progress = Math.min(1, convertImages());
								
				displayLoadingProgress(progress);
				handleTransition(progress);

				pop();
			}
		})(),

		play: (() => {

			let state;

			function switchState (_state) {
				if (_state === "start") state = { state: "start", time: 1, next: "waiting" };
				else if (_state === "waiting") state = { state: "waiting", time: 60, next: "play" };
				else if (_state === "play") state = { state: "play", time: Infinity, next: null };
			}

			switchState("start");

			function handleState () {
				state.time --;
				if (state.time <= 0) switchState(state.next);
			}

			function start () {
				reset();
				bricks.reset();
			}

			function reset () {
				player.reset();
				ball.reset();
			}

			function wait () {
				player.display();
				ball.display();
				bricks.run();

				displayScore();
				displayLives();
			}

			function play () {
				player.run({ keys });
				ball.run({ player, bricks });
				bricks.run();

				if (ball.hitBottom) {
					lives --;
					reset();
					switchState("waiting");
				}

				displayScore();
				displayLives();

				if (lives < 1) scenes.transition({ to: "dead", type: "wait", speed: 3 })
				else if (bricks.bricks.length <= 0) scenes.transition({ to: "win", type: "wait", speed: 3 });
			}

			function displayScore () {
				push();

				fill(colors.white);
				stroke(colors.lightBlack);
				strokeWeight(10 * SCALE);

				textAlign(CENTER, CENTER);
				textFont('Google Sans Code');
				textSize(70 * SCALE);

				text(String(score).padStart(4, '0'), WIDTH/2, 59 * SCALE);

				pop();
			}

			const displayLives = (() => {

				const offset = 50 * SCALE;
				const increment = 70 * SCALE;
				const size = 50 * SCALE;

				return function () {
					push();

					stroke(colors.white);
					strokeWeight(4 * SCALE);

					for (let i = 0; i < 3; i ++) {
						if (i + 1 < lives) fill(colors.white);
						else noFill();

						circle(offset + i * increment, offset, size);
					}

					pop();
				}
			})();

			return function () {
				background(colors.black);

				if (state.state === "start") start();
				else if (state.state === "waiting") wait(); 
				else if (state.state === "play") play();

				handleState();
			}
		})(),

		dead: (() => {
			return function () {
				push();

				background(colors.black);
				fill(colors.white);
				
				textFont("Google Sans");
				textSize(100 * SCALE);
				textAlign(CENTER, CENTER);

				text("YOU DIED", WIDTH/2, 400 * SCALE);

				pop();
			}
		})(),

		win: (() => {
			return function () {
				push();

				background(colors.black);
				fill(colors.white);
				
				textFont("Google Sans");
				textSize(100 * SCALE);
				textAlign(CENTER, CENTER);

				text("YOU WON!", WIDTH/2, 400 * SCALE);

				pop();
			}
		})(),
	};

	scenes.setDefault("colors.transition", colors.darkBlack);
	scenes.setDefault("colors.loading.background", colors.black);
	scenes.setDefault("colors.loading.text", colors.white);

	return scenes;
})();

const drawFunction = (() => {

	// Delta time calculations
	let deltaTime = 17;
	let then = performance.now();

	function getDeltaTime () {
		const now = performance.now();
		const delataTime = now - then;
		then = now;

		// Limit delta time so that physics arent unpredictable when really laggy
		return Math.max(1000/30, delataTime);
	}

	// not using function x() {} notation because iife. iife is simply for organization here
	setup = function() {
	
		// this clears all animation frames preventing them from stacking up if the webpage is reloaded
		// sourced from stack overflow somewhere
		let id = window.requestAnimationFrame(function(){});
		while (id--) {
			window.cancelAnimationFrame(id);
		}
		
		createCanvas(WIDTH, HEIGHT);
	};
	
	draw = function() {
		deltaTime = getDeltaTime();
		scenes.run(deltaTime);
	};
})();

const userInput = (() => {
	// not using function x() {} notation because iife. iife is simply for organization here

	mousePressed = function() {
		click = true;
	}

	keyPressed = function() {
		keys[key] = keys[key.toString().toLowerCase()] = true;
	}
	
	keyReleased = function() {
		keys[key] = keys[key.toString().toLowerCase()] = false;
	}
})();
