import { LineType, themeLine } from './line.js';

const control = document.querySelector('#control');

const AudioContext = window.AudioContext || window.webkitAudioContext;

let oscillators = [];
let connections = [];

export {oscillators};

const createConnections = () => {
	for (let connection of connections) {
		const input = window[connection.input];
		const output = window[connection.output];
		if (input && output) {
			try {
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
		console.log(`${lineType.name}: ${lineResult}`);
		if (lineResult) {
			if ('oscillator' in lineResult.result) {
				oscillators.push(lineResult.result.oscillator);
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
	for (let oscillator of oscillators) {
		oscillator.stop();
	}
	oscillators = [];
	connections = [];
	parseControl();
	createConnections();
	for (let oscillator of oscillators) {
		oscillator.start();
	}
});