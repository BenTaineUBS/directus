/**
 * Replace windows style backslashes with unix forwards slashes
 */
export const normalizePath = (path: string) => {
	if (path === '\\' || path === '/') return '/';

	if (path.length <= 1) {
		return path;
	}

	let prefix = '';

	if (path.length > 4 && path[3] === '\\') {
		if (['?', '.'].includes(path[2]!) && path.slice(0, 2) === '\\\\') {
			path = path.slice(2);
			prefix = '//';
		}
	}

	const segments = path.split(/[/\\]+/);

	if (segments.at(-1) === '') {
		segments.pop();
	}

	return prefix + segments.join('/');
};
