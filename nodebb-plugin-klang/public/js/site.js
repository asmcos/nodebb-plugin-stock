'use strict';

(function () {
	function apply(dark) {
		document.documentElement.classList.toggle('dark', dark);
		document.documentElement.setAttribute('data-bs-theme', dark ? 'dark' : 'light');
		var btn = document.getElementById('klangThemeBtn');
		if (btn) {
			btn.setAttribute('aria-pressed', dark ? 'true' : 'false');
			btn.setAttribute('aria-label', dark ? '切换到浅色' : '切换到深色');
		}
	}

	function bind() {
		var btn = document.getElementById('klangThemeBtn');
		if (!btn || btn.dataset.bound) {
			apply(document.documentElement.classList.contains('dark'));
			return;
		}
		btn.dataset.bound = '1';
		apply(document.documentElement.classList.contains('dark'));
		btn.addEventListener('click', function () {
			var dark = !document.documentElement.classList.contains('dark');
			apply(dark);
			try {
				localStorage.setItem('klang-theme', dark ? 'dark' : 'light');
			} catch (e) { /* ignore */ }
		});
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', bind);
	} else {
		bind();
	}
	if (window.jQuery) {
		window.jQuery(window).on('action:ajaxify.end', bind);
	}
}());
