export class Line {
	static types = [];

	constructor(name, pattern, handler) {
		this.name = name;
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

	print() {
		return `${this.name}\n`;
	}
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

export const themeLine = new Line("Theme", THEME_REGEX, ({theme}) => {
	if (theme === 'light') {
		document.body.classList.remove('theme-dark');
		document.body.classList.add('theme-light');
	} else if (theme === 'dark') {
		document.body.classList.remove('theme-light');
		document.body.classList.add('theme-dark');
	}
});

export const oscillatorLine = new Line("Oscillator", OSCILLATOR_REGEX, ({name, shape, frequency, output}) => {
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

export const gainLine = new Line("Gain", GAIN_REGEX, ({name, level, output}) => {
	const gain = context.createGain();
	gain.gain.value = level / 100;
	connections.push({
		input: name,
		output: output
	});
	window[name] = gain;
});

export const filterLine = new Line("Filter", FILTER_REGEX, ({name, type, frequency, output}) => {
	const filter = context.createBiquadFilter();
	filter.type = type;
	filter.frequency.value = frequency;
	connections.push({
		input: name,
		output: output
	});
	window[name] = filter;
});