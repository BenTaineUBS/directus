import { getNodeEnv } from '@directus/utils/node';
import { setTimeout } from 'timers/promises';
import getDatabase from '../../database/index.js';
import { useLogger } from '../../logger.js';
import { getRandomWaitTime } from '../utils/get-random-wait-time.js';
import { getUnsentOnboardingUsers } from '../utils/get-users-with-unsent-onboarding.js';
import { getReport } from './get-report.js';
import { resendOnboardings } from './send-onboardings.js';
import { sendReport } from './send-report.js';

/**
 * Generate and send a usage report. Resend onboarding answers.
 * Will log on error, but not throw. No need to be awaited
 *
 * @param opts Options for the tracking
 * @param opts.wait Whether or not to wait a random amount of time between 0 and 30 minutes
 * @returns whether or not the tracking was successful
 */
export const track = async (opts = { wait: true }) => {
	const logger = useLogger();
	const db = getDatabase();

	if (opts.wait) {
		await setTimeout(getRandomWaitTime());
	}

	try {
		const report = await getReport();
		await sendReport(report);

		const userIds = await getUnsentOnboardingUsers(db);
		await resendOnboardings(userIds);

		return true;
	} catch (err) {
		if (getNodeEnv() === 'development') {
			logger.error(err);
		}

		return false;
	}
};
