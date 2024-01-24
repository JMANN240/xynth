class Line {
	static types = [];

	constructor(pattern, handler) {
		this.pattern = pattern;
		this.handler = handler;

		Line.types.push(this);
	}

	parse(line) {
		const result = this.pattern.exec(line);

		if (result) {
			this.handler(result.groups)
		}

		return Boolean(result);
	}
}

const control = document.querySelector('#control');

const AudioContext = window.AudioContext || window.webkitAudioContext;

const randreal = (lower, upper) => {
	const range = upper - lower;
	return lower + Math.random() * range;
}

const randint = (lower, upper) => {
	const real = randreal(lower, upper);
	return Math.floor(real);
}

const getNode = (node) => {
	const targets = node.split('.');
	let value = window;
	for (const target of targets)
	{
		value = value[target];
	}
	return value;
}

const namedParameter = (name, pattern) => {
	return `(?<${name}>${pattern})`;
}

const wordParameter = (name) => {
	return namedParameter(name, '\\w+');
}

const digitParameter = (name) => {
	return namedParameter(name, '\\d+');
}

const alternativesParameter = (name, ...alternatives) => {
	const alternativesPattern = alternatives.join('|');
	return namedParameter(name, alternativesPattern);
}

const linePattern = (pattern) => {
	return new RegExp(`^${pattern}$`);
}

const THEME_REGEX = linePattern(
	alternativesParameter('theme', 'light', 'dark')
);

const OSCILLATOR_REGEX = linePattern(
	`${wordParameter('name')}=osc\\.${alternativesParameter('shape', 'sine', 'square', 'triangle', 'saw')}\\.${digitParameter('frequency')}>${wordParameter('output')}`
);

const GAIN_REGEX = linePattern(
	`${wordParameter('name')}=gain\\.${digitParameter('level')}>${wordParameter('output')}`
);

const FILTER_REGEX = linePattern(
	`${wordParameter('name')}=filter\\.${alternativesParameter('type', 'lowpass', 'highpass')}\\.${digitParameter('frequency')}>${wordParameter('output')}`
);

const themeLine = new Line(THEME_REGEX, ({theme}) => {
	if (theme === 'light') {
		document.body.classList.remove('theme-dark');
		document.body.classList.add('theme-light');
	} else if (theme === 'dark') {
		document.body.classList.remove('theme-light');
		document.body.classList.add('theme-dark');
	}
});

const oscillatorLine = new Line(OSCILLATOR_REGEX, ({name, shape, frequency, output}) => {
	const osc = context.createOscillator();
	osc.type = shape;
	osc.frequency.value = frequency;
	osc.start();
	if (!oscillators.includes(osc)) {
		oscillators.push(osc);
	}
	connections.push({
		input: name,
		output: output
	});
	window[name] = osc;
});

const gainLine = new Line(GAIN_REGEX, ({name, level, output}) => {
	const gain = context.createGain();
	gain.gain.value = level / 100;
	connections.push({
		input: name,
		output: output
	});
	window[name] = gain;
});

const filterLine = new Line(FILTER_REGEX, ({name, type, frequency, output}) => {
	const filter = context.createBiquadFilter();
	filter.type = type;
	filter.frequency.value = frequency;
	connections.push({
		input: name,
		output: output
	});
	window[name] = filter;
});

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