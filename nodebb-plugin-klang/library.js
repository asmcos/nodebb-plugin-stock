'use strict';

const fs = require('fs');
const path = require('path');

const nconf = require.main.require('nconf');
const winston = require.main.require('winston');
const meta = require.main.require('./src/meta');
const db = require.main.require('./src/database');
const categories = require.main.require('./src/categories');
const topics = require.main.require('./src/topics');
const user = require.main.require('./src/user');
const privileges = require.main.require('./src/privileges');

const plugin = module.exports;

const INDICES = ['sh000001', 'sz399001', 'sz399006'];
const SKIP_NAME = /^(Announcements|General Discussion|Comments & Feedback|Blogs|Uncategorized|未分类)$/i;

plugin.init = async function (params) {
	if (params && params.router) {
		params.router.get('/klang-usercard.js', function (_req, res) {
			res.set('Cache-Control', 'no-cache');
			res.type('js').sendFile(path.join(__dirname, 'public/js/usercard.js'));
		});
	}
	await installShellTemplates();
	const title = await meta.configs.get('title');
	if (!title || title === 'NodeBB') {
		await meta.configs.setMultiple({
			title: 'Klang（金浪）',
			'title:short': 'Klang',
			browserTitle: 'Klang（金浪）AI量化论坛',
			description: 'AI 量化、策略、行情和工具讨论',
			defaultLang: 'zh-CN',
			homePageTitle: '主页',
		});
	}
	const route = await meta.configs.get('homePageRoute');
	if (!route || route === 'categories') {
		await meta.configs.set('homePageRoute', 'klang');
	}
	winston.info('[klang] plugin ready');
};

plugin.addScript = async function (scripts) {
	const prefix = nconf.get('relative_path') || '';
	scripts.push(`${prefix}/klang-usercard.js`);
	return scripts;
};

async function installShellTemplates() {
	const views = nconf.get('views_dir');
	if (!views) {
		return;
	}
	try {
		const benchpress = require.main.require('benchpressjs');
		const dir = path.join(__dirname, 'templates');
		for (const name of ['header.tpl', 'footer.tpl', 'klang-home.tpl']) {
			let source = await fs.promises.readFile(path.join(dir, name), 'utf8');
			source = await inlineImports(source, views, new Set());
			await fs.promises.writeFile(path.join(views, name), source);
			const compiled = await benchpress.precompile(source, { filename: name });
			await fs.promises.writeFile(path.join(views, name.replace(/\.tpl$/, '.js')), compiled);
		}
		winston.info('[klang] shell templates installed');
	} catch (err) {
		winston.error(`[klang] shell templates skipped: ${err.message}`);
	}
}

async function inlineImports(source, views, seen) {
	const marker = /<!-- IMPORT (.+?) -->/;
	const match = source.match(marker);
	if (!match) {
		return source;
	}
	const partial = match[1].trim();
	let body = '';
	if (!seen.has(partial)) {
		seen.add(partial);
		try {
			body = await fs.promises.readFile(path.join(views, partial), 'utf8');
			body = await inlineImports(body, views, seen);
		} catch (err) {
			winston.warn(`[klang] partial missing: ${partial}`);
		}
	}
	source = source.replace(marker, () => body);
	return inlineImports(source, views, seen);
}

plugin.addBodyClass = async function (data) {
	const templateData = data.templateData || data.templateValues || {};
	templateData.bodyClass = `${templateData.bodyClass || ''} klang-body`.trim();
	data.templateData = templateData;
	return data;
};

plugin.defineHomepage = async function (data) {
	data.routes = data.routes || [];
	data.routes.push({
		route: 'klang',
		name: 'Klang 首页',
	});
	return data;
};

plugin.renderHomepage = async function (hookData) {
	const { req, res } = hookData;
	const uid = req.uid;
	const relative_path = nconf.get('relative_path') || '';
	const { members, hues, presence } = await getMembers(uid);
	const [cats, square, quotes, counts, me, canPost] = await Promise.all([
		getCategories(uid),
		getSquare(uid, 8, hues),
		getIndices(),
		getCounts(),
		getMe(uid, hues),
		privileges.categories.canPostTopic(uid),
	]);
	const skip = new Set(square.map(topic => String(topic.tid)));
	const recent = await getRecent(uid, 5, skip, hues);

	res.render('klang-home', {
		title: meta.config.homePageTitle || '主页',
		breadcrumbs: undefined,
		relative_path,
		categories: cats,
		square,
		topics: recent,
		quotes,
		quotesReady: quotes.some(q => q.price),
		members,
		presence,
		me,
		counts,
		loggedIn: !!req.loggedIn,
		canPost,
		config: { relative_path },
	});
};

async function getCategories(uid) {
	const cids = await categories.getCidsByPrivilege('categories:cid', uid, 'topics:read');
	const data = await categories.getCategoriesData(cids);
	const visible = data.filter(cat => cat && cat.cid > 0 && !SKIP_NAME.test(cat.name || ''));
	try {
		await categories.getRecentTopicReplies(visible, uid, {});
	} catch (err) {
		winston.warn(`[klang] recent category topics skipped: ${err.message}`);
	}
	const relative = nconf.get('relative_path') || '';
	return visible
		.sort((a, b) => (a.order || 0) - (b.order || 0))
		.map((cat, i) => {
			const last = cat.posts && cat.posts[0] && cat.posts[0].topic;
			return {
				cid: cat.cid,
				name: cat.name,
				description: cat.description || '',
				num: String(i + 1).padStart(2, '0'),
				topicCount: cat.totalTopicCount || cat.topic_count || 0,
				postCount: cat.totalPostCount || cat.post_count || 0,
				link: `${relative}/category/${cat.slug || cat.cid}`,
				color: cat.bgColor || '',
				lastTitle: last && last.title ? last.title : '',
				lastUrl: last && last.slug ? `${relative}/topic/${last.slug}` : '',
			};
		});
}

async function getSquare(uid, count, hues) {
	try {
		const tids = await db.getSortedSetRevRange('topics:recent', 0, 249);
		if (!tids.length) {
			return [];
		}
		const cards = await db.sortedSetsCard(tids.map(tid => `tid:${tid}:posters`));
		const multi = [];
		for (let i = 0; i < tids.length; i += 1) {
			if (cards[i] > 1) {
				multi.push(tids[i]);
			}
			if (multi.length >= count + 4) {
				break;
			}
		}
		const list = await topics.getTopics(multi, uid);
		return (await shapeMany(list, hues, uid)).slice(0, count);
	} catch (err) {
		winston.warn(`[klang] square skipped: ${err.message}`);
		return [];
	}
}

async function getRecent(uid, count, skip, hues) {
	const data = await topics.getSortedTopics({
		uid,
		start: 0,
		stop: count + skip.size + 8,
		sort: 'recent',
		term: 'alltime',
		filter: '',
	});
	const shaped = await shapeMany(data.topics || [], hues, uid);
	return shaped.filter(topic => !skip.has(String(topic.tid))).slice(0, count);
}

async function shapeMany(list, hues, uid) {
	const rows = (list || []).filter(Boolean);
	const posterUids = await Promise.all(rows.map(async (topic) => {
		try {
			return await topics.getUids(topic.tid);
		} catch (err) {
			return [];
		}
	}));
	const all = [...new Set(posterUids.flat().map(String).filter(id => id && id !== '0'))];
	const users = all.length ? await user.getUsers(all, uid || 0) : [];
	const byId = {};
	users.forEach((person) => {
		if (person && person.uid) {
			byId[String(person.uid)] = person;
		}
	});
	return rows.map((topic, index) => {
		const voices = (posterUids[index] || [])
			.map(id => byId[String(id)])
			.filter(Boolean)
			.slice(0, 3)
			.map(person => faceOf(person, hues))
			.filter(Boolean);
		return shapeTopic(topic, voices, hues);
	});
}

function shapeTopic(topic, voices, hues) {
	const author = faceOf(topic.user || {}, hues) || {
		name: '访客', initial: '?', userslug: '', picture: '', hue: 0,
	};
	const people = voices.length ? voices : [author];
	const teaserUser = (topic.teaser && topic.teaser.user) || {};
	const teaserName = teaserUser.displayname || teaserUser.fullname || teaserUser.username || '';
	let teaserText = plain(topic.teaser && (topic.teaser.content || topic.teaser.sourceContent));
	if (teaserText === String(topic.title || '').trim() || looksLikeQuote(teaserText)) {
		teaserText = '';
	}
	const relative = nconf.get('relative_path') || '';
	const postcount = Number(topic.postcount) || 0;
	const replies = Math.max(0, postcount - 1);
	const views = Number(topic.viewcount) || 0;
	return {
		tid: topic.tid,
		title: topic.title,
		url: `${relative}/topic/${topic.slug}`,
		postcount,
		replies,
		views,
		crowd: people.length > 1,
		countTitle: `${replies} 回复，${views} 浏览`,
		timestampISO: topic.lastposttimeISO || topic.timestampISO,
		when: when(topic.lastposttime || topic.timestamp),
		pinned: !!topic.pinned,
		user: author,
		voices: people,
		voiceNames: people.map(person => person.name).join('、'),
		teaser: teaserText ? {
			text: teaserText,
			name: teaserName,
			other: !!(teaserName && teaserName !== author.name),
		} : null,
		category: {
			name: (topic.category && topic.category.name) || '',
			link: topic.category && topic.category.slug ? `${relative}/category/${topic.category.slug}` : '',
			color: (topic.category && topic.category.bgColor) || '',
		},
	};
}

function faceOf(person, hues) {
	if (!person || !(person.username || person.displayname || person.fullname)) {
		return null;
	}
	const name = person.displayname || person.fullname || person.username;
	const seed = person.userslug || person.username || name;
	const id = person.uid != null ? String(person.uid) : '';
	let tone = hueOf(seed);
	if (id && hues && hues[id] != null) {
		tone = hues[id];
	}
	return {
		name,
		initial: Array.from(String(name))[0] || '?',
		userslug: person.userslug || '',
		picture: person.picture || '',
		hue: tone,
	};
}

function hueOf(seed) {
	let tone = 0;
	const text = String(seed || '');
	for (let i = 0; i < text.length; i += 1) {
		tone = (tone * 33 + text.charCodeAt(i)) >>> 0;
	}
	return tone % 8;
}

async function getMembers(uid) {
	try {
		const [list, onlineUids] = await Promise.all([
			user.getUsersFromSet('users:postcount', uid, 0, 23),
			user.getUidsFromSet('users:online', 0, 23),
		]);
		const online = new Set((onlineUids || []).map(String));
		const hues = {};
		const members = [];
		(list || []).forEach((person) => {
			if (!person || !person.uid || !person.username) {
				return;
			}
			hues[String(person.uid)] = members.length % 8;
			const face = faceOf(person, hues);
			if (!face) {
				return;
			}
			face.posts = person.postcount || 0;
			face.online = online.has(String(person.uid));
			face.label = face.online ? `${face.name} 在看，${face.posts} 篇` : `${face.name}，${face.posts} 篇`;
			members.push(face);
		});
		const watching = (onlineUids && onlineUids.length)
			? await user.getUsers(onlineUids, uid)
			: [];
		const names = watching
			.map(person => person && (person.displayname || person.username))
			.filter(Boolean);
		let presence = '';
		if (names.length === 1) {
			presence = `${names[0]} 在看`;
		} else if (names.length > 1) {
			presence = `${names.length} 人在看`;
		}
		return { members, hues, presence };
	} catch (err) {
		winston.warn(`[klang] members skipped: ${err.message}`);
		return { members: [], hues: {}, presence: '' };
	}
}

async function getMe(uid, hues) {
	if (!uid) {
		return null;
	}
	try {
		const person = await user.getUserFields(uid, ['uid', 'username', 'userslug', 'picture', 'fullname']);
		return faceOf(person, hues);
	} catch (err) {
		return null;
	}
}

function looksLikeQuote(text) {
	const codes = String(text || '').match(/(?:sh|sz|bj)\d{6}/gi);
	return !!(codes && codes.length) || /记录\s*\d/.test(text || '');
}

function when(ms) {
	const time = Number(ms);
	if (!time) {
		return '';
	}
	const delta = Date.now() - time;
	const minute = 60000;
	const hour = 60 * minute;
	const day = 24 * hour;
	if (delta < hour) {
		return `${Math.max(1, Math.round(delta / minute))} 分钟前`;
	}
	if (delta < day) {
		return `${Math.max(1, Math.round(delta / hour))} 小时前`;
	}
	if (delta < day * 30) {
		return `${Math.max(1, Math.round(delta / day))} 天前`;
	}
	if (delta < day * 365) {
		return `${Math.max(1, Math.round(delta / (day * 30)))} 个月前`;
	}
	return `${Math.max(1, Math.round(delta / (day * 365)))} 年前`;
}

function plain(text) {
	return String(text || '')
		.replace(/<[^>]+>/g, ' ')
		.replace(/&nbsp;/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()
		.slice(0, 120);
}

function shapeIndex(code, name, price, rise) {
	const n = Number(rise);
	const cls = n > 0 ? 'up' : (n < 0 ? 'down' : 'flat');
	const text = Number.isFinite(n) ? `${n > 0 ? '+' : ''}${n.toFixed(2)}%` : String(rise || '');
	return {
		code,
		name: name || code,
		price: String(price || ''),
		rise: text,
		cls,
		url: `https://klang.hk.cn/kline.html?code=${code}`,
	};
}

async function indicesFromKlang() {
	const response = await fetch(`https://api.klang.org.cn/v2/list/${INDICES.join(',')}`, {
		signal: AbortSignal.timeout(2000),
	});
	if (!response.ok) {
		throw new Error(`quote api ${response.status}`);
	}
	const rows = await response.json();
	if (!Array.isArray(rows) || !rows.length) {
		throw new Error('quote api empty');
	}
	return rows.filter(row => Array.isArray(row) && row[0] && row[2]).map(row => (
		shapeIndex(String(row[0]).toLowerCase(), row[1], row[2], row[3])
	));
}

async function indicesFromSina() {
	const response = await fetch(`https://hq.sinajs.cn/list=${INDICES.join(',')}`, {
		headers: { Referer: 'https://finance.sina.com.cn' },
		signal: AbortSignal.timeout(4000),
	});
	if (!response.ok) {
		throw new Error(`sina ${response.status}`);
	}
	const text = new TextDecoder('gbk').decode(Buffer.from(await response.arrayBuffer()));
	const out = [];
	const re = /hq_str_((?:sh|sz|bj)\d+)="([^"]*)"/gi;
	let match = re.exec(text);
	while (match) {
		const parts = match[2].split(',');
		const prev = Number(parts[2]);
		let price = Number(parts[3]);
		if (!(price > 0) && prev > 0) {
			price = prev;
		}
		if (price > 0) {
			const rise = prev > 0 ? ((price - prev) / prev) * 100 : 0;
			out.push(shapeIndex(match[1].toLowerCase(), parts[0], price.toFixed(2), rise));
		}
		match = re.exec(text);
	}
	return out;
}

async function getIndices() {
	try {
		const rows = await indicesFromKlang();
		if (rows.length) {
			return rows;
		}
	} catch (err) {
		/* Klang quote API is down; Sina still has the live price. */
	}
	try {
		return await indicesFromSina();
	} catch (err) {
		return [];
	}
}

async function getCounts() {
	try {
		const [topics, posts, users] = await Promise.all([
			db.sortedSetCard('topics:tid'),
			db.sortedSetCard('posts:pid'),
			db.sortedSetCard('users:joindate'),
		]);
		return { topics, posts, users };
	} catch (err) {
		return { topics: 0, posts: 0, users: 0 };
	}
}

