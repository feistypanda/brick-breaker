const [WIDTH, HEIGHT] = [1200, 800];

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
	return {

	};
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
				else throw "data.getImage or data.image is required";

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

					if (typeof data.image !== "object") errors.push("invalid data.speed");

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
	
			let curInd = 0;
			let keys = Object.keys(images);
	
			return function () {

				background(scenes.defaults.colors.loading.background);
	
				// replace the functions in the image objects with what they return;
				if (images[keys[curInd]]) images[keys[curInd]] = images[keys[curInd]]();
				
				// generate text with . for progress
				let txt = (() => {
	
					if (curInd >= keys.length - 1) return "LOADED!";
	
					let res = ["LOADING"];
					for (let j = 0; j <= curInd / 2; j ++) {
						res[res.length - 1] += "."
						if (textWidth(res[res.length - 1]) > 550) {
							res[res.length - 1] += "\n";
							res.push("");
						}
					}

					const innitial = "";
					const fullRes = res.reduce(
					   (accumulator, currentValue) => accumulator + currentValue,
						innitial,
					);

					return fullRes;
				})();
				
				// Display the loading progress
				textSize(100);
				textFont('Anton');
				fill(scenes.defaults.colors.loading.text);
				textAlign(CENTER, BASELINE);
	
				text(txt, 300, 270);
	
				curInd ++;

				if (curInd >= keys.length) {
					scenes.transition({
						to: sceneAfterLoading,
						getImage: get,

					});
				}
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
