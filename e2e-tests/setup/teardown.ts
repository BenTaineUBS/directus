import Listr from 'listr';

export default async () => {
	console.log('\n');

	await new Listr([
		{
			title: 'Close database connections',
			task: () =>
				new Listr(
					[
						{
							title: 'Postgres',
							task: async () => await global.__databases__[0].destroy(),
						},
					],
					{ concurrent: true }
				),
		},
		{
			title: 'Stop Docker containers',
			task: () =>
				new Listr(
					[
						{
							title: 'Postgres',
							task: async () => await global.__containers__[0].stop(),
						},
					],
					{ concurrent: true }
				),
		},
		{
			title: 'Remove Docker containers',
			task: () =>
				new Listr(
					[
						{
							title: 'Postgres',
							task: async () => await global.__containers__[0].remove(),
						},
					],
					{ concurrent: true }
				),
		},
	]).run();

	console.log('\n');
};
