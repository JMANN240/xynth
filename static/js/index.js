import { Line } from './line.js';
import { randint } from './util.js';

const control = document.querySelector('#control');

const AudioContext = window.AudioContext || window.webkitAudioContext;

const oscillators = [];
let connections = [];

const createConnections = () => {
	for (let connection of connections) {
		const input = window[connection.input];
		const output = window[connection.output];
		if (input && output) {
			input.connect(output);
		}
	}
}

const parseControlLine = (controlLine) => {
	controlLine = controlLine.replace(/\s/g, '');

	for (let lineType of Line.types) {
		if (lineType.parse(controlLine)) {
			return;
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
parseControl(context, masterVolume);
createConnections();

control.addEventListener('input', () => {
	localStorage.setItem('control', control.value);
	for (let connection of connections) {
		const input = window[connection.input];
		const output = window[connection.output];
		if (input && output) {
			input.disconnect(output);
		}
	}
	for (let oscillator of oscillators) {
		oscillator.stop();
	}
	connections = [];
	parseControl();
	createConnections();
	const osc = context.createOscillator();
	const noteGain = context.createGain();
	noteGain.gain.value = 1;
	osc.type = 'square';
	osc.frequency.setValueAtTime(220 + 220 * Math.pow(2, randint(0, 12)/12), context.currentTime);
	osc.start(context.currentTime);
	osc.stop(context.currentTime + 0.1);
	osc.connect(noteGain);
	noteGain.connect(masterVolume);
});