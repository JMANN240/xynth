export class LineType {
	static types = [];

	constructor(name, pattern, handler) {
		this.name = name;
		this.pattern = pattern;
		this.handler = handler;

		LineType.types.push(this);
	}

	parse(context, line) {
		const result = this.pattern.exec(line);

		if (result) {
			return this.handler(context, result.groups)
		}

		return null;
	}

	print() {
		return `${this.name}\n`;
	}
}

class LineResult {
	constructor(result, connection) {
		this.result = result;
		this.connection = connection;
	}
}

const namedParameter = (name, pattern) => {
	return `(?<${name}>${pattern})`;
}

const wordParameter = (name) => {
	return namedParameter(name, '\\w+');
}

const intParameter = (name) => {
	return namedParameter(name, '\\d+');
}

const floatParameter = (name) => {
	return namedParameter(name, '\\d+(?:\\.\\d+)?');
}

const alternativesParameter = (name, ...alternatives) => {
	const alternativesPattern = alternatives.join('|');
	return namedParameter(name, alternativesPattern);
}

const dottedWordParameter = (name) => {
	return namedParameter(name, '[\\w\\.]+');
}

const linePattern = (pattern) => {
	return new RegExp(`^${pattern}$`);
}

const THEME_REGEX = linePattern(
	alternativesParameter('theme', 'light', 'dark')
);

const OSCILLATOR_REGEX = linePattern(
	`${wordParameter('name')}=osc\\.${alternativesParameter('shape', 'sine', 'square', 'triangle', 'sawtooth')}~${floatParameter('frequency')}>${dottedWordParameter('output')}`
);

const GAIN_REGEX = linePattern(
	`${wordParameter('name')}=gain\\^${floatParameter('level')}>${dottedWordParameter('output')}`
);

const FILTER_REGEX = linePattern(
	`${wordParameter('name')}=filter\\.${alternativesParameter('type', 'lowpass', 'highpass')}~${floatParameter('frequency')}>${dottedWordParameter('output')}`
);

export const themeLine = new LineType("Theme", THEME_REGEX, (context, {theme}) => {
	if (theme === 'light') {
		document.body.classList.remove('theme-dark');
		document.body.classList.add('theme-light');
	} else if (theme === 'dark') {
		document.body.classList.remove('theme-light');
		document.body.classList.add('theme-dark');
	}

	return new LineResult({ 'theme': theme }, null);
});

export const oscillatorLine = new LineType("Oscillator", OSCILLATOR_REGEX, (context, {name, shape, frequency, output}) => {
	const oscillator = context.createOscillator();
	oscillator.type = shape;
	oscillator.frequency.value = frequency;
	window[name] = oscillator;
	window[`${name}.frequency`] = oscillator.frequency;

	return new LineResult({ 'oscillator': oscillator }, { input: name, output: output });
});

export const gainLine = new LineType("Gain", GAIN_REGEX, (context, {name, level, output}) => {
	const gain = context.createGain();
	gain.gain.value = level;
	window[name] = gain;

	return new LineResult({ 'gain': gain }, { input: name, output: output });
});

export const filterLine = new LineType("Filter", FILTER_REGEX, (context, {name, type, frequency, output}) => {
	const filter = context.createBiquadFilter();
	filter.type = type;
	filter.frequency.value = frequency;
	window[name] = filter;

	return new LineResult({ 'filter': filter }, { input: name, output: output });
});