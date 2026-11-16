'use strict';

module.exports = {
	prefix: 'tw-',
	important: 'body.klang-body',
	corePlugins: { preflight: false },
	content: ['./templates/**/*.tpl', './src/**/*.css'],
	theme: {
		extend: {
			colors: {
				canvas: 'var(--bg)',
				card: 'var(--panel)',
				ink: 'var(--ink)',
				body: 'var(--ink2)',
				muted: 'var(--ink3)',
				line: 'var(--line)',
				soft: 'var(--soft)',
				faint: 'var(--faint)',
				accent: 'var(--accent)',
			},
			fontFamily: {
				sans: [
					'"PingFang SC"',
					'"HarmonyOS Sans SC"',
					'"Microsoft YaHei"',
					'"Noto Sans CJK SC"',
					'system-ui',
					'sans-serif',
				],
			},
			boxShadow: {
				card: '0 1px 2px rgb(24 24 27 / 0.04)',
			},
		},
	},
};
