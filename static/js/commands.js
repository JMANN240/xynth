import { LineType, themeLine } from "./line.js";

const commands = document.querySelector('#commands');

const controlValue = localStorage.getItem('control');

for (let controlLine of controlValue.split('\n')) {
	if (themeLine.parse(null, controlLine)) {
		break;
	}
}

commands.value = "";
for (let lineType of LineType.types) {
	commands.value += `${lineType.print()}\n`;
}