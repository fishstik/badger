class Favibadge {
	constructer() {
		console.log('Favibadge constructed');
	}

	searchElement(className) {
		var element;
		var nav = document.body.getElementsByClassName(className);
		if (nav.length) {
			var potential = nav[0];
			if (potential.className.indexOf(className) !== -1) {
				element = potential;
			}
		}
		return element ? element: null;
	}
}

export default Favibadge;
