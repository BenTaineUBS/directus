import argon2 from 'argon2';
import Auth from './auth';
import { User } from '../../types';
import { InvalidPayloadException } from '@directus/shared/exceptions';
import { InvalidCredentialsException } from '../../exceptions';

export default class LocalAuth extends Auth {
	/**
	 * Get user id by email
	 */
	async userID(identifier: string): Promise<string> {
		const user = await this.knex
			.select('id')
			.from('directus_users')
			.whereRaw('LOWER(??) = ?', ['identifier', identifier.toLowerCase()])
			.orWhereRaw('LOWER(??) = ?', ['email', identifier.toLowerCase()])
			.first();

		if (!user) {
			throw new InvalidCredentialsException();
		}

		return user.id;
	}

	/**
	 * Verify user password
	 */
	async verify(user: User, password?: string): Promise<void> {
		if (!user.password || !(await argon2.verify(user.password, password as string))) {
			throw new InvalidCredentialsException();
		}
	}
}
