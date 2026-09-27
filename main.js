
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

	console.log(vw, vh);

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

const copyObj = obj => JSON.parse(JSON.stringify(obj));

const images = (() => {

	const images = {

	};

	return images;
})();

const Vector = (() => {

	class Vector {
		constructor (x, y, z) {
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
	class Player {
		constructor (config) {
			this.position = new Vector(config.x ?? 0, config.y ?? 0);
		}
	}
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
					slide (amt, color) {
						fill(color);
						noStroke();
						rect(-WIDTH + WIDTH * anim1(amt) * 2, 0, WIDTH, HEIGHT);
					},
				}
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

					if (!Object.keys(transitionFunctions).includes(data.type)) errors.push("invalid data.type");

					if (errors.length === 0) return { success: true };
					else return { errors };
				}
			})();

			const handleScene = (() => {
				return function (amt, data) {
					
					// Display image from last scene
					if (amt < 0.5) image(data.image, 0, 0, WIDTH, HEIGHT);

					// Run the next scene
					else if (amt < 1) scenes[data.to]();
					
					// Switch to next scene
					else currentScene = data.to;
				}
			})();

			const displayTransition = (() => {

				return function (amt, data) {

					push();

					for (const i in transitionFunctions) if (data.type === i) {
						transitionFunctions[i](amt, data.color);
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
			return function () {
				background(colors.black);

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
