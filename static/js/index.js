import { LineType, themeLine } from './line.js';

const control = document.querySelector('#control');

const AudioContext = window.AudioContext || window.webkitAudioContext;

let sources = [];
let connections = [];
let timedConstants = [];

const createConnections = () => {
	for (let connection of connections) {
		console.log(connection);
		const input = window[connection.input];
		const output = window[connection.output];
		if (input && output) {
			try {
				console.log(input);
				console.log(output);
				input.connect(output);
			} catch (error) {
				console.error(error);
			}
		}
	}
}

const deleteConnections = () => {
	for (let connection of connections) {
		const input = window[connection.input];
		if (input) {
			try {
				input.disconnect();
			} catch (error) {
				console.error(error);
			}
		}
	}
}

const parseControlLine = (controlLine) => {
	controlLine = controlLine.replace(/\s/g, '');

	for (let lineType of LineType.types) {
		const lineResult = lineType.parse(context, controlLine);
		if (lineResult) {
			if ('oscillator' in lineResult.result) {
				sources.push(lineResult.result.oscillator);
			}

			if ('noise' in lineResult.result) {
				sources.push(lineResult.result.noise);
			}

			if ('pulse' in lineResult.result) {
				sources.push(lineResult.result.pulse);
			}

			if ('timedConst' in lineResult.result) {
				timedConstants.push(lineResult.result.timedConst);
			}

			if (lineResult.connection) {
				connections.push(lineResult.connection);
			}

			break;
		}
	}
}

const parseControl = () => {
	const controlLines = control.value.split('\n');
	for (let controlLine of controlLines)
	{
		parseControlLine(controlLine);
	}
}

const context = new AudioContext();
const masterVolume = context.createGain();
masterVolume.connect(context.destination);
masterVolume.gain.value = 0.2;
window.master = masterVolume;

control.value = localStorage.getItem('control');

for (let controlLine of control.value.split('\n')) {
	if (themeLine.parse(context, controlLine)) {
		break;
	}
}

control.addEventListener('input', () => {
	localStorage.setItem('control', control.value);
	deleteConnections();
	for (let source of sources) {
		source.stop();
	}
	sources = [];
	connections = [];
	timedConstants = [];
	parseControl();
	createConnections();
	for (let source of sources) {
		source.start();
	}
});

let loopTime = 0;

const update = () => {
	loopTime = (context.currentTime * (window.speed ?? 1)) % (window.length ?? 4);
	for (let timedConstant of timedConstants) {
		const afterStart = loopTime >= parseInt(timedConstant.start);
		const beforeStop = loopTime < (parseInt(timedConstant.start) + parseInt(timedConstant.length));
		const inTime = afterStart && beforeStop; 
		if (inTime && window[timedConstant.output]) {
			window[timedConstant.output].value = timedConstant.value;
		}
	}
	setTimeout(update, 10);
}

update();