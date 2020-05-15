var canvas;
var canvasContext;
var ballX = 300;
var ballY = 350;
var ballSpeedX = 10;
var ballSpeedY = 0;
var ballMissed = false;
const BALL_RADIUS = 10;

var leftPlayerScore = 0;
var rightPlayerScore = 0;
const WINNING_SCORE = 3;

var showingStartScreen = true;
var showingWinScreen = false;

var leftPaddleY = 300;
var rightPaddleY = 300;
const PADDLE_HEIGHT = 100;
const PADDLE_WIDTH = 10;
const PADDLE_GAP = 208;

var computerSpeed = 0;
var computerMaxSpeed = 7;
var computerAccel = 0.5;
const COMPUTER_MOVE_BUFFER = 35;

var isMuted = false;
var isPaused = false;
const MUTE_POS = {x:50, y:580};
const PAUSE_POS = {x:980, y:580};

var bonkSnd = new Audio("bonk.mp3");
var whiffSnd = new Audio("whiff.mp3");
var yussSnd = new Audio("yuss.mp3");
var awwSnd = new Audio("aww.mp3");
var allSounds = [bonkSnd, whiffSnd, yussSnd, awwSnd];

var coffeeImg = new Image();
coffeeImg.src = "images/computer_coffee.png";
var sleepImg = new Image();
sleepImg.src = "images/computer_sleep.png";
var playerReadyImg = new Image();
playerReadyImg.src = "images/player_ready.png";
var playerHitImg = new Image();
playerHitImg.src = "images/player_hit.png";
var computerReadyImg = new Image();
computerReadyImg.src = "images/computer_ready.png";
var computerHitImg = new Image();
computerHitImg.src = "images/computer_hit.png";

var playerTimer = 0;
var computerTimer = 0;
const ANIMATE_LENGTH = 15;

function calculateMousePos(evt) {
	var rect = canvas.getBoundingClientRect();
	var root = document.documentElement;
	var mouseX = evt.clientX - rect.left - root.scrollLeft;
	var mouseY = evt.clientY - rect.top - root.scrollTop;
	return {
		x:mouseX,
		y:mouseY
	};
}

function handleMouseClick(evt) {
	if (showingStartScreen) {
		showingStartScreen = false;
		ballSpeedX = 10;
		ballReset();
	}
	else if (showingWinScreen) {
		leftPlayerScore = 0;
		rightPlayerScore = 0;
		showingWinScreen = false;
	}
	else {
		var pos = calculateMousePos(evt);
		if (pos.x > MUTE_POS.x && pos.x < MUTE_POS.x+80 &&
			pos.y < MUTE_POS.y && pos.y > MUTE_POS.y-20) {
				isMuted = !isMuted;
				for (var snd in allSounds) {
					allSounds[snd].muted = isMuted;
				}
		}
		else {
			isPaused = !isPaused;
			//set paddle to new mouse position after pause
			canvas.dispatchEvent(new MouseEvent(
				'mousemove', {'clientX':evt.clientX,'clientY':evt.clientY}
			));
		}
	}
}

window.onload = function() {
	canvas = document.getElementById('gameCanvas');
	canvasContext = canvas.getContext('2d');

	var framesPerSecond = 30;
	setInterval( function() {
		moveEverything();
		drawEverything();
	}, 1000/framesPerSecond );

	canvas.addEventListener('mousedown', handleMouseClick);

	canvas.addEventListener('mousemove', function(evt) {
			if (isPaused || showingStartScreen) {return;}
			var mousePos = calculateMousePos(evt);
			leftPaddleY = mousePos.y - (PADDLE_HEIGHT/2);
			//rightPaddleY = mousePos.y - (PADDLE_HEIGHT/2);
		}
	);
};

function computerMovement() {
	var paddleCenter = rightPaddleY + (PADDLE_HEIGHT/2);

	if (paddleCenter < ballY-COMPUTER_MOVE_BUFFER) {
		computerAccelTo(computerMaxSpeed);
	}
	else if (paddleCenter > ballY+COMPUTER_MOVE_BUFFER){
		computerAccelTo(-computerMaxSpeed);
	}
	else {
		computerAccelTo(0);
	}
}

function computerAccelTo(target) {
	if (computerSpeed < target) {
		computerSpeed += computerAccel;
	}
	else if (computerSpeed > target){
		computerSpeed -= computerAccel;
	}
	rightPaddleY += computerSpeed;
}

function increaseDifficulty() {
	computerMaxSpeed += 3;
	computerAccel *= 2;
}
function decreaseDifficulty() {
	computerMaxSpeed -= 3;
	computerAccel *= 0.5;
	if (computerMaxSpeed < 1 || computerAccel < 0.125) {
		computerMaxSpeed = 1;
		computerAccel = 0.125;
	}
}

function ballMovement() {
	ballX += ballSpeedX;
	ballY += ballSpeedY;
	ballPaddleCollision = PADDLE_GAP + PADDLE_WIDTH + BALL_RADIUS
	ballPaddleCollision -= 2; //for flavor

	//left wall
	if (ballX < 0) {
		rightPlayerScore += 1;
		ballReset();
	}
	else if (ballX < ballPaddleCollision && !ballMissed) {
		playerTimer = ANIMATE_LENGTH;
		if (ballY > leftPaddleY &&
			ballY < leftPaddleY + PADDLE_HEIGHT) {
				ballSpeedX = -ballSpeedX;
				if (!showingStartScreen) {
					bonkSnd.play();

					var deltaY = ballY - (leftPaddleY + PADDLE_HEIGHT/2);
					ballSpeedY = deltaY * 0.35;
				}
				else {
					ballSpeedY = 0;
				}
		}
		else {
			ballMissed = true;
			whiffSnd.play();
		}
	}
	//right wall
	if (ballX > canvas.width) {
		leftPlayerScore += 1;
		ballReset();
	}
	else if (ballX > canvas.width-ballPaddleCollision && !ballMissed) {
		computerTimer = ANIMATE_LENGTH;
		if (ballY > rightPaddleY &&
			ballY < rightPaddleY + PADDLE_HEIGHT) {
				ballSpeedX = -ballSpeedX;
				if (!showingStartScreen) {
					bonkSnd.play();

					var deltaY = ballY - (rightPaddleY + PADDLE_HEIGHT/2);
					ballSpeedY = deltaY * 0.35;
				}
				else {
					ballSpeedY = 0;
				}
		}
		else {
			ballMissed = true;
			whiffSnd.play();
		}
	}

	//top wall
	if (ballY < 0) {
		ballSpeedY = -ballSpeedY;
		ballY = 0
	}
	//bottom wall
	if (ballY > canvas.height) {
		ballSpeedY = -ballSpeedY;
		ballY = canvas.height;
	}
}

function ballReset() {
	if (leftPlayerScore >= WINNING_SCORE) {
		increaseDifficulty();
		yussSnd.play();
		showingWinScreen = true;
	} else if (rightPlayerScore >= WINNING_SCORE) {
		decreaseDifficulty();
		awwSnd.play();
		showingWinScreen = true;
	}

	ballSpeedY = 0;
	ballX = canvas.width/2;
	ballY = canvas.height/2;
	ballMissed = false;
}

function moveEverything() {
	if (showingWinScreen || isPaused) {
		return;
	}
	else if (showingStartScreen) {
		ballMovement();
		return;
	}
	computerMovement();
	ballMovement();
}

function drawNet() {
	for (var i=0; i<canvas.height; i+=40) {
		colorRect(canvas.width/2 - 1,i, 2,20, 'white')
	}
}

function drawMute() {
	canvasContext.fillStyle = 'white';
	canvasContext.textAlign = 'left';
	canvasContext.font = 'normal 15pt monospace';
	var text = isMuted ? "unmute" : "mute";
	canvasContext.fillText(text, MUTE_POS.x,MUTE_POS.y);
}

function drawPause() {
	canvasContext.fillStyle = 'white';
	canvasContext.textAlign = 'left';
	canvasContext.font = 'normal 10pt monospace';
	canvasContext.fillText("(click anywhere to pause)", PAUSE_POS.x,PAUSE_POS.y);
}

function colorCircle(centerX,centerY, radius, drawColor) {
	canvasContext.fillStyle = drawColor;
	canvasContext.beginPath();
	canvasContext.arc(centerX,centerY, radius, 0,Math.PI*2, true);
	canvasContext.fill();
}

function colorRect(leftX,topY, width,height, drawColor) {
	canvasContext.fillStyle = drawColor;
	canvasContext.fillRect(leftX,topY, width,height);
}

function drawEverything() {
	colorRect(0,0, canvas.width,canvas.height, 'black');

	if (showingWinScreen) {
		canvasContext.fillStyle = 'white';
		canvasContext.textAlign = 'center';
		canvasContext.font = 'normal 20pt monospace';

		if (leftPlayerScore >= WINNING_SCORE) {
			canvasContext.drawImage(coffeeImg, canvas.width/2 - 150,canvas.height/3 + 50);
			canvasContext.fillText("PLAYER WINS!", canvas.width/2,200);
			canvasContext.font = 'normal 15pt monospace';
			canvasContext.fillText("(your opponent drinks some coffee...)", canvas.width/2,250);
		} else if (rightPlayerScore >= WINNING_SCORE) {
			canvasContext.drawImage(sleepImg, canvas.width/2 - 160,canvas.height/3 + 80);
			canvasContext.fillText("COMPUTER WINS!", canvas.width/2,200);
			canvasContext.font = 'normal 15pt monospace';
			canvasContext.fillText("(your opponent is feeling sleepy...)", canvas.width/2,250);
		}
		canvasContext.fillText("CLICK TO CONTINUE", canvas.width/2,520);
		return;
	}

	var playerImg = (playerTimer <= 0) ? playerReadyImg : playerHitImg;
	var computerImg = (computerTimer <= 0) ? computerReadyImg : computerHitImg;

	if (playerTimer > 0 && !isPaused) {
		playerTimer -= 1;
	}
	if (computerTimer > 0 && !isPaused) {
		computerTimer -= 1;
	}

	//ball
	colorCircle(ballX,ballY, BALL_RADIUS, 'white');

	if (showingStartScreen) {
		canvasContext.drawImage(playerImg, 0,200)
		canvasContext.drawImage(computerImg, canvas.width-computerReadyImg.width,200);
		canvasContext.fillStyle = 'white';
		canvasContext.textAlign = 'center';
		canvasContext.font = 'normal 12pt monospace';
		canvasContext.fillText("oh hey, it's", canvas.width/2,canvas.height/2-100);
		canvasContext.font = 'normal 30pt monospace';
		canvasContext.fillText('"TENNIS"', canvas.width/2,canvas.height/2-50);
		canvasContext.font = 'normal 15pt monospace';
		canvasContext.fillText("CLICK TO START", canvas.width/2,520);
		return;
	}

	//scores
	canvasContext.fillStyle = 'white';
	canvasContext.font = 'normal 40pt monospace';
	canvasContext.textAlign = 'center';
	canvasContext.fillText(leftPlayerScore, 100,100);
	canvasContext.fillText(rightPlayerScore, canvas.width-100,100);

	//left (player) paddle
	colorRect(PADDLE_GAP,leftPaddleY,
				PADDLE_WIDTH,PADDLE_HEIGHT, 'white');
	canvasContext.drawImage(playerImg, 40,leftPaddleY);

	//right (computer) paddle
	colorRect(canvas.width-(PADDLE_WIDTH+PADDLE_GAP),rightPaddleY,
				PADDLE_WIDTH,PADDLE_HEIGHT, 'white');
	canvasContext.drawImage(computerImg, 970,rightPaddleY);

	drawNet();
	drawMute();
	drawPause();
}