'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const winston = require.main.require('winston');
const nconf = require.main.require('nconf');

const { renderPng } = require('./lib/image');
const { digest, sameCode, issueCode } = require('./lib/code');

const plugin = module.exports;
const TTL = 3 * 60 * 1000;
const WINDOW = 60 * 1000;
const LIMIT = 30;
const hits = new Map();

plugin.init = async function (params) {
	const router = params.router;
	const script = fs.readFileSync(path.join(__dirname, 'public/captcha.js'));
	router.get('/klang-captcha.png', sendImage);
	router.get('/klang-captcha.js', function (_req, res) {
		res.set('Cache-Control', 'no-cache');
		res.type('js').send(script);
	});
	winston.info('[klang-captcha] ready');
};

plugin.addScript = async function (scripts) {
	const prefix = nconf.get('relative_path') || '';
	scripts.push(`${prefix}/klang-captcha.js`);
	return scripts;
};

plugin.checkRegister = async function (payload) {
	const given = String(payload.userData && payload.userData['klang-captcha'] || '').replace(/\s/g, '');
	const saved = payload.req.session && payload.req.session.klangCaptcha;
	if (payload.req.session) {
		delete payload.req.session.klangCaptcha;
	}
	if (!saved || saved.exp < Date.now() || !sameCode(given, saved.hash)) {
		throw new Error('验证码不对，请换一张再填写');
	}
	return payload;
};

function sendImage(req, res) {
	const ip = req.ip || req.socket.remoteAddress || 'unknown';
	if (limited(ip)) {
		res.set('Retry-After', '10');
		return res.status(429).type('txt').send('请稍后再换一张');
	}
	if (!req.session) {
		return res.status(400).type('txt').send('验证码暂时取不到');
	}
	const code = issueCode();
	req.session.klangCaptcha = {
		hash: digest(code).toString('hex'),
		exp: Date.now() + TTL,
	};
	const png = renderPng(code, max => crypto.randomInt(0, max));
	req.session.save((err) => {
		if (err || res.headersSent) {
			if (err) {
				winston.error(`[klang-captcha] session: ${err.message}`);
			}
			if (!res.headersSent) {
				res.status(500).type('txt').send('验证码暂时取不到');
			}
			return;
		}
		res.set('Cache-Control', 'no-store');
		res.type('png').send(png);
	});
}

function limited(ip) {
	const now = Date.now();
	const recent = (hits.get(ip) || []).filter(time => now - time < WINDOW);
	if (recent.length >= LIMIT) {
		hits.set(ip, recent);
		return true;
	}
	recent.push(now);
	hits.set(ip, recent);
	if (hits.size > 5000) {
		hits.clear();
	}
	return false;
}
