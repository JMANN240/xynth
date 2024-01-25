export const randreal = (lower, upper) => {
	const range = upper - lower;
	return lower + Math.random() * range;
}

export const randint = (lower, upper) => {
	const real = randreal(lower, upper);
	return Math.floor(real);
}

export const notes = {
	"C": 261.63,
	"C#": 277.18,
	"Db": 277.18,
	"D": 293.66,
	"D#": 311.13,
	"Eb": 311.13,
	"E": 329.63,
	"F": 349.23,
	"F#": 369.99,
	"Gb": 369.99,
	"G": 392.00,
	"G#": 415.30,
	"Ab": 415.30,
	"A": 440.00,
	"A#": 466.16,
	"Bb": 466.16,
	"B": 493.88,
}

export const getNote = (note, octave) => {
	const baseFrequency = notes[note];
	const octaveShift = octave - 4;
	const multiplier = Math.pow(2, octaveShift);
	return baseFrequency * multiplier;
}