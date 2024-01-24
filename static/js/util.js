export const randreal = (lower, upper) => {
	const range = upper - lower;
	return lower + Math.random() * range;
}

export const randint = (lower, upper) => {
	const real = randreal(lower, upper);
	return Math.floor(real);
}