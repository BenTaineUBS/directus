import * as path from 'path';
import { HYBRID_EXTENSION_TYPES } from '../../constants/index.js';
import type {
	AppExtension,
	AppExtensionType,
	Extension,
	HybridExtension,
	HybridExtensionType,
} from '../../types/index.js';
import { isTypeIn } from '../array-helpers.js';

export function generateExtensionsEntry(type: AppExtensionType | HybridExtensionType, extensions: Extension[]): string {
	const filteredExtensions = extensions.filter(
		(extension): extension is AppExtension | HybridExtension => extension.type === type
	);

	return `${filteredExtensions
		.map(
			(extension, i) =>
				`import e${i} from './${path
					.relative(
						'.',
						path.resolve(
							extension.path,
							isTypeIn(extension, HYBRID_EXTENSION_TYPES) ? extension.entrypoint.app : extension.entrypoint
						)
					)
					.split(path.sep)
					.join(path.posix.sep)}';\n`
		)
		.join('')}export default [${filteredExtensions.map((_, i) => `e${i}`).join(',')}];`;
}
