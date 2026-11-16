'use strict';

const API = 'https://api.klang.org.cn/v2/list/';
const KLINE = 'https://klang.hk.cn/kline.html?code=';
const TTL = 20000;

const LEGACY_LINK = /<a\b[^>]*href=["']?https:\/\/klang\.hk\.cn\/kline\.html\?code=((?:sh|sz|bj)\.?\d{6})[^>]*>[\s\S]*?<\/a>/gi;
const TOKEN = /(?<![\w./?=&])((?:sh|sz|bj)\.?\d{6})(\[时间:[^\]]*价格:([^\]]*)\])?/gi;
const BARE = /(?<![\w./?=&])((?:sh|sz|bj)\.?\d{6})(?!\[时间:)/gi;
const BLOCK = /<(pre|code)\b[^>]*>[\s\S]*?<\/\1>/gi;

const cache = new Map();

function canon(code) {
	return String(code || '').replace('.', '').toLowerCase();
}

function esc(value) {
	return String(value == null ? '' : value).replace(/[&<>"']/g, (ch) => ({
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#39;',
	}[ch]));
}

function stampDate(date) {
	const d = date || new Date();
	return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
}

function formatRise(raw) {
	const n = Number(raw);
	if (!Number.isFinite(n)) {
		return { text: esc(raw), cls: 'flat' };
	}
	const cls = n > 0 ? 'up' : (n < 0 ? 'down' : 'flat');
	const text = `${n > 0 ? '+' : ''}${n.toFixed(2)}%`;
	return { text, cls };
}

function protect(html) {
	const blocks = [];
	const safe = String(html || '').replace(BLOCK, (block) => {
		const token = `\u0000KLANG${blocks.length}\u0000`;
		blocks.push(block);
		return token;
	});
	return { safe, blocks };
}

function restore(html, blocks) {
	return html.replace(/\u0000KLANG(\d+)\u0000/g, (all, index) => blocks[Number(index)] || all);
}

function unwrapLegacy(html) {
	return String(html || '').replace(LEGACY_LINK, (all, code) => canon(code) || all);
}

function remember(out, code, quote, ttl) {
	cache.set(code, { exp: Date.now() + ttl, quote });
	out[code] = quote;
}

async function fetchKlang(codes) {
	const out = {};
	const response = await fetch(API + codes.join(','), { signal: AbortSignal.timeout(2000) });
	if (!response.ok) {
		throw new Error(`quote api ${response.status}`);
	}
	const rows = await response.json();
	if (!Array.isArray(rows)) {
		return out;
	}
	rows.forEach((row) => {
		if (!Array.isArray(row) || !row[0] || !row[2]) {
			return;
		}
		out[canon(row[0])] = {
			name: String(row[1] || ''),
			price: String(row[2]),
			rise: String(row[3] || ''),
		};
	});
	return out;
}

async function fetchSina(codes) {
	const response = await fetch(`https://hq.sinajs.cn/list=${codes.join(',')}`, {
		headers: { Referer: 'https://finance.sina.com.cn' },
		signal: AbortSignal.timeout(4000),
	});
	if (!response.ok) {
		throw new Error(`sina ${response.status}`);
	}
	const text = new TextDecoder('gbk').decode(Buffer.from(await response.arrayBuffer()));
	const out = {};
	const re = /hq_str_((?:sh|sz|bj)\d+)="([^"]*)"/gi;
	let match = re.exec(text);
	while (match) {
		const code = canon(match[1]);
		const parts = match[2].split(',');
		const prev = Number(parts[2]);
		let price = Number(parts[3]);
		if (!(price > 0) && prev > 0) {
			price = prev;
		}
		if (price > 0) {
			const rise = prev > 0 ? ((price - prev) / prev) * 100 : 0;
			out[code] = {
				name: parts[0] || code,
				price: price.toFixed(2),
				rise: String(rise),
			};
		}
		match = re.exec(text);
	}
	return out;
}

async function fetchQuotes(codes) {
	const now = Date.now();
	const out = {};
	const need = [];
	codes.forEach((code) => {
		const hit = cache.get(code);
		if (hit && hit.exp > now) {
			out[code] = hit.quote;
		} else if (!need.includes(code)) {
			need.push(code);
		}
	});
	if (!need.length) {
		return out;
	}
	let live = {};
	try {
		live = await fetchKlang(need);
	} catch (err) {
		live = {};
	}
	const missing = need.filter(code => !live[code] || !live[code].price);
	if (missing.length) {
		try {
			const extra = await fetchSina(missing);
			live = { ...live, ...extra };
		} catch (err) {
			/* keep whatever Klang returned */
		}
	}
	need.forEach((code) => {
		const quote = live[code] && live[code].price ? live[code] : null;
		remember(out, code, quote, quote ? TTL : 5000);
	});
	return out;
}

function collect(html, regex) {
	const codes = [];
	const re = new RegExp(regex.source, regex.flags);
	let match = re.exec(html);
	while (match) {
		const code = canon(match[1]);
		if (code && !codes.includes(code)) {
			codes.push(code);
		}
		match = re.exec(html);
	}
	return codes;
}

function chip(code, quote, snapshot) {
	const rise = formatRise(quote.rise);
	const recorded = snapshot ? `<span class="ks-snap">记录 ${esc(snapshot)}</span>` : '';
	return `<a class="klang-stock ${rise.cls}" href="${KLINE}${esc(code)}" target="_blank" rel="noopener noreferrer" title="${esc(quote.name || code)}"><span class="ks-code">${esc(code)}</span><span class="ks-px">${esc(quote.price)}</span><span class="ks-chg">${rise.text}</span>${recorded}</a>`;
}

async function decorate(html) {
	if (!html || typeof html !== 'string' || !/(?:sh|sz|bj)\.?\d{6}/i.test(html)) {
		return html;
	}
	const shielded = protect(unwrapLegacy(html));
	const codes = collect(shielded.safe, TOKEN);
	if (!codes.length) {
		return html;
	}
	const quotes = await fetchQuotes(codes);
	const re = new RegExp(TOKEN.source, TOKEN.flags);
	const next = shielded.safe.replace(re, (all, raw, snapshot, price) => {
		const code = canon(raw);
		const quote = quotes[code];
		if (!quote || !quote.price) {
			return all;
		}
		return chip(code, quote, snapshot ? price : '');
	});
	return restore(next, shielded.blocks);
}

async function stamp(html) {
	if (!html || typeof html !== 'string' || !/(?:sh|sz|bj)\.?\d{6}/i.test(html)) {
		return html;
	}
	const shielded = protect(html);
	const codes = collect(shielded.safe, BARE);
	if (!codes.length) {
		return html;
	}
	const quotes = await fetchQuotes(codes);
	const date = stampDate();
	const re = new RegExp(BARE.source, BARE.flags);
	const next = shielded.safe.replace(re, (all, raw) => {
		const code = canon(raw);
		const quote = quotes[code];
		if (!quote || !quote.price) {
			return all;
		}
		return `${raw}[时间:${date},价格:${quote.price}]`;
	});
	return restore(next, shielded.blocks);
}

async function stampFields(post) {
	if (!post) {
		return post;
	}
	if (typeof post.content === 'string') {
		post.content = await stamp(post.content);
	}
	if (typeof post.sourceContent === 'string' && post.sourceContent) {
		post.sourceContent = await stamp(post.sourceContent);
	}
	return post;
}

async function mapContents(items, field) {
	const present = items.filter(item => item && typeof item[field] === 'string' && item[field]);
	if (!present.length) {
		return;
	}
	const decorated = await Promise.all(present.map(item => decorate(item[field])));
	present.forEach((item, index) => {
		item[field] = decorated[index];
	});
}

const plugin = {};

plugin.sanitizeConfig = async function (config) {
	config.allowedTags = config.allowedTags || [];
	if (!config.allowedTags.includes('span')) {
		config.allowedTags.push('span');
	}
	return config;
};

plugin.onCreate = async function (data) {
	if (data && data.post) {
		await stampFields(data.post);
	}
	return data;
};

plugin.onEdit = async function (data) {
	if (data && data.post) {
		await stampFields(data.post);
	}
	return data;
};

plugin.onGetPosts = async function (data) {
	if (data && Array.isArray(data.posts)) {
		await mapContents(data.posts, 'content');
	}
	return data;
};

plugin.onTeasers = async function (data) {
	if (data && Array.isArray(data.teasers)) {
		await mapContents(data.teasers, 'content');
	}
	return data;
};

plugin.onRaw = async function (content) {
	if (typeof content !== 'string') {
		return content;
	}
	try {
		return await decorate(content);
	} catch (err) {
		return content;
	}
};

module.exports = plugin;

if (require.main === module) {
	(async () => {
		const legacy = '<p>法拉电子\t<a  href=https://klang.hk.cn/kline.html?code=sh600563 target=_blank>sh600563[ 108.10:<font color=#ff0000> +0.46</font> ]</a>[时间:6/17/2026,价格:170.22]</p>';
		const html = await decorate(legacy);
		if (!html.includes('klang-stock') || !html.includes('记录 170.22') || html.includes('<font')) {
			console.error('decorate failed', html);
			process.exit(1);
		}
		const stamped = await stamp('看看 sz002156 和 sh600563[时间:1/1/2020,价格:1]');
		if (!/sz002156\[时间:/.test(stamped) || !/sh600563\[时间:1\/1\/2020,价格:1\]/.test(stamped)) {
			console.error('stamp failed', stamped);
			process.exit(1);
		}
		const plain = await decorate('<p>通富微电 sz002156</p>');
		if (!plain.includes('通富微电') || !plain.includes('klang-stock')) {
			console.error('plain failed', plain);
			process.exit(1);
		}
		console.log('stock plugin ok');
		console.log(html);
		console.log(stamped);
	})().catch((err) => {
		console.error(err);
		process.exit(1);
	});
}
