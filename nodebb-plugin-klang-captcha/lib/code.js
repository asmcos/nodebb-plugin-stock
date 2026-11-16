'use strict';

const crypto = require('crypto');

function digest(code) {
	return crypto.createHash('sha256').update(String(code)).digest();
}

function sameCode(given, hex) {
	if (!/^\d{4}$/.test(given) || typeof hex !== 'string' || hex.length !== 64) {
		return false;
	}
	const actual = Buffer.from(hex, 'hex');
	const expected = digest(given);
	return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

function issueCode() {
	return String(crypto.randomInt(0, 10000)).padStart(4, '0');
}

module.exports = { digest, sameCode, issueCode };
