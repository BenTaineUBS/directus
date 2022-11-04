import run from '../../../database/migrations/run';
import getDatabase from '../../../database';
import { cliLogger as logger } from '../../../logger';

export default async function migrate(direction: 'latest' | 'up' | 'down'): Promise<void> {
	const database = getDatabase();

	try {
		logger.info('Running migrations...');

		await run(database, direction);

		if (direction === 'down') {
			logger.info('Downgrade successful');
		} else {
			logger.info('Database up to date');
		}
		database.destroy();
		process.exit();
	} catch (err: any) {
		logger.error(err);
		database.destroy();
		process.exit(1);
	}
}
