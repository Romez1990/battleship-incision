//#region Physical time

class Time {
	
	constructor(fps = 60, scale = 1) {
		this.fps = fps;
		this.delay = 1000 / this._fps;
		this.scale = scale;
	}
	
	get fps() {
		return this._fps;
	}
	
	set fps(fps) {
		if (typeof (fps) === 'number' && fps > 0) {
			this._fps = fps;
			this.delay = 1000 / this._fps;
			
			try {
				if (isPause) return;
				stopAllIntervals();
				setAllIntervals();
			} catch {
			}
		}
	}
	
	get scale() {
		return this._scale;
	}
	
	set scale(scale) {
		if (typeof (scale) === 'number' && scale > 0) {
			this._scale = scale;
			
			try {
				if (isPause) return;
				stopAllIntervals();
				setAllIntervals();
			} catch {
			}
		}
	}
	
}

let time = new Time();

//#endregion

//#region Start

let game = $('#game');
let nameInput = $('#nameInput');
nameInput.focus();
let main = $('main');
$(document).on('keydown', startKeystrokes);
$('#start-button').on('click', () => startGame(nameInput.val()));

function startKeystrokes(e) {
	switch (e.keyCode) {
		case 13: // Enter
			startGame(nameInput.val());
			break;
	}
}

function startGame(name) {
	if (name.length === 0) {
		alert('Введите имя!');
		return;
	}
	
	$(document).off('keydown', startKeystrokes);
	
	$('#start').css('display', 'none');
	game.css('display', 'block');
	$('#nameGame').text(name);
	
	setAllIntervals();
	$(window).on('keydown', gameKeystroke);
}

let mouse = {x: 0, /*y: 0, */isOver: false};

main.on('mousemove', e => {
	mouse.x = e.pageX;
	// mouse.y = e.pageY;
});

main.on('mouseenter', () => mouse.isOver = true);
main.on('mouseleave', () => mouse.isOver = false);

function gameKeystroke(e) {
	switch (e.keyCode) {
		case 32: // Space
		case 13: // Enter
			if (mouse.isOver)
				new Torpedo(mouse.x);
			break;
		case 27: // Escape
			pause();
			break;
	}
}

//#endregion

//#region Intervals

let intervals = [];
let mouseCreateTorpedo = e => new Torpedo(e.pageX);

function setAllIntervals() {
	intervals.push(setInterval(timeTick, 1000));
	intervals.push(setInterval(() => new Ship(), 2000 / time.scale));
	
	Ship.runAll();
	Torpedo.runAll();
	
	new Ship();
	
	main.on('click', mouseCreateTorpedo);
	main.on('mousemove', moveSight);
	main.css('cursor', 'none');
}

function stopAllIntervals() {
	while (intervals.length !== 0) {
		clearInterval(intervals[0]);
		intervals.splice(0, 1);
	}
	
	Ship.stopAll();
	Torpedo.stopAll();
	
	main.off('click', mouseCreateTorpedo);
	main.off('mousemove', moveSight);
	main.css('cursor', 'default');
}

//#endregion

//#region Move sight

let sight = $('#sight');

function moveSight(e) {
	let mainOffset = main.offset();
	sight.css({
		'left': (e.clientX - mainOffset.left) / adaptivityScale,
		'top': (e.clientY - mainOffset.top) / adaptivityScale
	});
}

//#endregion

//#region Ships

class Ship {
	
	constructor() {
		if (Ship.instances.length >= 3) return;
		
		Ship.instances.push(this);
		
		this.dom = $('<div class="ship"></div>');
		Ship.parent.append(this.dom);
		
		this.dom.addClass(Ship.classes[randomRange(3)]);
		
		let getValueFromRange = (factor, upperBound, lowerBound) => factor * (upperBound - lowerBound) + lowerBound;
		
		let factor = Math.random();
		const shipScale = 0.25;
		const nearnessScale = 1.7;
		this.dom.css({
			top: getValueFromRange(factor, 150, 300),
			width: getValueFromRange(factor, shipScale * this.dom.width(), shipScale * this.dom.width() * nearnessScale),
			height: getValueFromRange(factor, shipScale * this.dom.height(), shipScale * this.dom.height() * nearnessScale),
			zIndex: Math.round((1 - factor) * 1000)
		});
		
		let direction = randomRange(2) === 0 ? 1 : -1;
		
		this.speed = randomRangeFloat(40, 70) * direction; // px/s
		
		this.dom.css({
			left: this.speed > 0 ? -this.dom.width() : main.width(),
			transform: `scale(${direction}, 1)`
		});
		
		let ship = this;
		this.movementTimer = setInterval(() => ship.move(), time.delay);
	}
	
	move() {
		this.dom.css('left', parseFloat(this.dom.css('left')) + this.speed * time.scale / time.fps);
		
		if (this.speed > 0) {
			if (parseInt(this.dom.css('left')) > main.width())
				this.remove();
		} else {
			if (parseInt(this.dom.css('left')) < -this.dom.width())
				this.remove();
		}
	};
	
	remove() {
		this.dom.detach();
		let index = Ship.instances.indexOf(this);
		if (index !== -1) {
			Ship.instances.splice(index, 1);
		}
		clearInterval(this.movementTimer);
	}
	
	static runAll() {
		Ship.instances.forEach(ship => {
			ship.movementTimer = setInterval(() => ship.move(), time.delay);
		});
	}
	
	static stopAll() {
		Ship.instances.forEach(ship => {
			clearInterval(ship.movementTimer);
		});
	}
	
}

Ship.instances = [];
Ship.parent = $('#ships');
Ship.classes = ['ship1', 'ship2', 'ship3'];

//#endregion

//#region Torpedoes

class Torpedo {
	
	constructor(mousePosX) {
		if (Torpedo.instances.length >= 3) return;
		
		Torpedo.instances.push(this);
		
		this.dom = $('<div class="torpedo"></div>');
		Torpedo.parent.append(this.dom);
		
		this.speed = 100; // px/s
		
		const torpedoScale = 0.85;
		this.dom.css({
			width: this.dom.width() * torpedoScale,
			height: this.dom.height() * torpedoScale,
			top: main.height(),
			left: (mousePosX - main.offset().left) / adaptivityScale
		});
		
		let torpedo = this;
		this.movementTimer = setInterval(() => torpedo.move(), time.delay);
	}
	
	move() {
		this.dom.css('top', parseFloat(this.dom.css('top')) - this.speed * time.scale / time.fps);
		
		if (parseInt(this.dom.css('top')) < 251 / 699 * main.height())
			this.remove();
		
		Ship.instances.forEach(ship => {
			let x1 = parseFloat(this.dom.css('left'));
			let y1 = parseFloat(this.dom.css('top'));
			let w1 = this.dom.width();
			let h1 = this.dom.height();
			let x2 = parseFloat(ship.dom.css('left'));
			let y2 = parseFloat(ship.dom.css('top'));
			let w2 = ship.dom.width();
			let h2 = ship.dom.height();
			let collision = collisionCheck(x1, y1, w1, h1, x2, y2, w2, h2);
			
			if (collision === false) return;
			
			ship.remove();
			this.remove();
			addScore(20);
		});
	};
	
	remove() {
		this.dom.detach();
		let index = Torpedo.instances.indexOf(this);
		if (index !== -1) {
			Torpedo.instances.splice(index, 1);
		}
		clearInterval(this.movementTimer);
	}
	
	static runAll() {
		Torpedo.instances.forEach(torpedo => {
			torpedo.movementTimer = setInterval(() => torpedo.move(), time.delay);
		});
	}
	
	static stopAll() {
		Torpedo.instances.forEach(torpedo => {
			clearInterval(torpedo.movementTimer);
		});
	}
	
}

Torpedo.parent = $('#torpedoes');
Torpedo.instances = [];

//#endregion

//#region Player time

let secondsPassed = 0;

function timeTick() {
	++secondsPassed;
	let second = secondsPassed % 60;
	let minute = parseInt(secondsPassed / 60);
	minute = minute < 10 ? '0' + minute : minute;
	second = second < 10 ? '0' + second : second;
	$('#time').text('Время: ' + minute + ':' + second);
}

//#endregion

//#region Score

let score = {
	dom: $('#score'),
	value: 0
};

function addScore(newScore) {
	score.value += newScore;
	score.dom.text(`Очки: ${score.value}`);
}

//#endregion

//#region Adaptivity

let appWrapper = $('#app-wrapper');
let wrapperWidth = 933;
let wrapperHeight = 700;
appWrapper.css({
	width: wrapperWidth,
	height: wrapperHeight
});

let adaptivityScale = 1;

function adapt() {
	let width = $(window).width();
	let height = $(window).height();
	
	adaptivityScale = width / height < wrapperWidth / wrapperHeight ?
		(width / wrapperWidth) :
		(height / wrapperHeight);
	appWrapper.css('transform', `translate(-50%, -50%) scale(${adaptivityScale})`);
}

adapt();
$(window).on('resize', adapt);

//#endregion

//#region Pause

let isPause = false;
let pauseScreen = $('#pause-screen');
$('#pause').on('click', pause);
pauseScreen.on('click', pause);

function pause() {
	isPause = !isPause;
	
	if (isPause) {
		stopAllIntervals();
		pauseScreen.fadeIn(250);
	} else {
		setAllIntervals();
		pauseScreen.fadeOut(250);
	}
	
	game.toggleClass('paused');
}

//#endregion

//#region Functions

function randomRange(min, max) {
	if (max === undefined) {
		return Math.floor(Math.random() * min);
	} else {
		return Math.floor(Math.random() * (max - min) + min);
	}
}

function randomRangeFloat(min, max) {
	if (max === undefined) {
		return Math.random() * min;
	} else {
		return Math.random() * (max - min) + min;
	}
}

function collisionCheck(x1, y1, w1, h1, x2, y2, w2, h2) {
	if (x1 < x2 + w2 &&
		x2 < x1 + w1 &&
		y1 < y2 + h2 &&
		y2 < h1 + y1) {
		return [(x1 + x2) / 2, (y1 + y2) / 2];
	} else {
		return false;
	}
}

//#endregion

//#region Debug

$(window).on('load', () => {
	// startGame('Any name');
	// sight.css('box-shadow', 'none');
	//pause();
});

//#endregion
