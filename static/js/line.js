export class LineType {
	static types = [];

	constructor(name, parameters, handler) {
		this.name = name;
		this.parameters = parameters;
		this.handler = handler;

		LineType.types.push(this);
	}

	getPattern() {
		let pattern = '';
		for (let parameter of this.parameters) {
			pattern += parameter.symbol;
			pattern += parameter.parameter.getPattern();
		}
		return linePattern(pattern);
	}

	parse(context, line) {
		const result = this.getPattern().exec(line);
		console.log(`Parsing '${line}'`);
		if (result) {
			return this.handler(context, result.groups)
		}

		return null;
	}

	print() {
		let output = `${this.name}\n`
		for (let parameter of this.parameters) {
			output += `\t${parameter.symbol}${parameter.parameter.print()}\n`;
		}
		return output;
	}
}

class LineTypeBuilder {
	constructor(name) {
		this.name = name;
		this.parameters = [];
	}

	addParameter(symbol, parameter) {
		this.parameters.push({
			'symbol': symbol,
			'parameter': parameter
		});
		return this;
	}

	setHandler(handler) {
		this.handler = handler;
		return this;
	}

	build() {
		return new LineType(this.name, this.parameters, this.handler);
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

class Parameter {
	getPattern() {
		return namedParameter(this.name, this.pattern);
	}
}

class ConstantParameter extends Parameter {
	constructor(pattern) {
		super();
		this.name = pattern;
		this.pattern = pattern;
	}

	getPattern() {
		return this.pattern;
	}

	print() {
		return `${this.pattern}`;
	}
}

class WordParameter extends Parameter {
	constructor(name) {
		super();
		this.name = name;
		this.pattern = '\\w+';
	}

	print() {
		return `${this.name} (word)`;
	}
}

class NumberParameter extends Parameter {
	constructor(name) {
		super();
		this.name = name;
		this.pattern = '\\d+(?:\\.\\d+)?';
	}

	print() {
		return `${this.name} (number)`;
	}
}

class AlternativesParameter extends Parameter {
	constructor(name, ...alternatives) {
		super();
		this.name = name;
		this.alternatives = alternatives;
		this.pattern = this.alternatives.join('|')
	}

	print() {
		return `${this.name} (${this.alternatives.join(', ')})`;
	}
}

class DottedWordParameter extends Parameter {
	constructor(name) {
		super();
		this.name = name;
		this.pattern = '\\w+(?:\\.\\w+)*';
	}

	print() {
		return `${this.name} (dotted word)`;
	}
}

const linePattern = (pattern) => {
	return new RegExp(`^${pattern}$`);
}

export const themeLine = new LineTypeBuilder("Theme")
	.addParameter('', new AlternativesParameter('theme', 'light', 'dark'))
	.setHandler(
		(context, {theme}) => {
			if (theme === 'light') {
				document.body.classList.remove('theme-dark');
				document.body.classList.add('theme-light');
			} else if (theme === 'dark') {
				document.body.classList.remove('theme-light');
				document.body.classList.add('theme-dark');
			}
		
			return new LineResult({ 'theme': theme }, null);
		}
	)
	.build();

export const oscillatorLine = new LineTypeBuilder("Oscillator")
	.addParameter('', new WordParameter('name'))
	.addParameter('=', new ConstantParameter('osc'))
	.addParameter('.', new AlternativesParameter('shape', 'sine', 'square', 'triangle', 'sawtooth'))
	.addParameter('~', new NumberParameter('frequency'))
	.addParameter('>', new DottedWordParameter('output'))
	.setHandler(
		(context, {name, shape, frequency, output}) => {
			const oscillator = context.createOscillator();
			oscillator.type = shape;
			oscillator.frequency.value = frequency;
			window[name] = oscillator;
			window[`${name}.frequency`] = oscillator.frequency;

			return new LineResult({ 'oscillator': oscillator }, { input: name, output: output });
		}
	)
	.build();

export const gainLine = new LineTypeBuilder("Gain")
	.addParameter('', new WordParameter('name'))
	.addParameter('=', new ConstantParameter('gain'))
	.addParameter('\\^', new NumberParameter('level'))
	.addParameter('>', new DottedWordParameter('output'))
	.setHandler(
		(context, {name, level, output}) => {
			const gain = context.createGain();
			gain.gain.value = level;
			window[name] = gain;
			window[`${name}.gain`] = gain.gain;

			return new LineResult({ 'gain': gain }, { input: name, output: output });
		}
	)
	.build();

export const filterLine = new LineTypeBuilder("Filter")
	.addParameter('', new WordParameter('name'))
	.addParameter('=', new ConstantParameter('filter'))
	.addParameter('.', new AlternativesParameter('type', 'lowpass', 'highpass'))
	.addParameter('~', new NumberParameter('frequency'))
	.addParameter('>', new DottedWordParameter('output'))
	.setHandler(
		(context, {name, type, frequency, output}) => {
			const filter = context.createBiquadFilter();
			filter.type = type;
			filter.frequency.value = frequency;
			window[name] = filter;
		
			return new LineResult({ 'filter': filter }, { input: name, output: output });
		}
	)
	.build();