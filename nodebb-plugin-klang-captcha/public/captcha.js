'use strict';

(function () {
	var STYLE = [
		'.klang-captcha-row{display:flex;align-items:center;gap:10px;}',
		'#klang-captcha-img{width:168px;height:64px;border:1px solid #e4e4e7;border-radius:12px;background:#fff1f2;cursor:pointer;}',
		'.klang-captcha-refresh{border:0;background:transparent;padding:0;color:#e11d48;font-size:13px;cursor:pointer;}',
		'.klang-captcha-refresh:hover{color:#be123c;}',
	].join('');

	function base() {
		return (window.config && config.relative_path) || '';
	}

	function showError(form, message) {
		var errorEl = form.querySelector('#register-error-notify');
		if (!errorEl) {
			return;
		}
		var text = errorEl.querySelector('p');
		if (text) {
			text.textContent = message;
		}
		errorEl.classList.remove('hidden');
	}

	function refresh(form) {
		var img = form.querySelector('#klang-captcha-img');
		var input = form.querySelector('#klang-captcha');
		if (img) {
			img.src = base() + '/klang-captcha.png?t=' + Date.now();
		}
		if (input) {
			input.value = '';
		}
	}

	function mount() {
		var form = document.querySelector('[component="register/local"]');
		if (!form || form.querySelector('[data-klang-captcha]')) {
			return;
		}
		if (!document.getElementById('klang-captcha-style')) {
			var style = document.createElement('style');
			style.id = 'klang-captcha-style';
			style.textContent = STYLE;
			document.head.appendChild(style);
		}
		var box = document.createElement('div');
		box.className = 'mb-2 d-flex flex-column gap-2';
		box.setAttribute('data-klang-captcha', '');
		box.innerHTML = [
			'<label for="klang-captcha">验证码</label>',
			'<div class="klang-captcha-row">',
			'<img id="klang-captcha-img" alt="四位数字验证码" width="168" height="64" title="看不清就换一张">',
			'<button type="button" class="klang-captcha-refresh" id="klang-captcha-refresh">换一张</button>',
			'</div>',
			'<input class="form-control" id="klang-captcha" name="klang-captcha" inputmode="numeric" autocomplete="off" maxlength="4" placeholder="输入图中的四位数字" aria-required="true">',
		].join('');
		var button = form.querySelector('#register');
		if (button) {
			button.before(box);
		} else {
			form.appendChild(box);
		}
		box.querySelector('#klang-captcha-refresh').addEventListener('click', function () {
			refresh(form);
		});
		box.querySelector('#klang-captcha-img').addEventListener('click', function () {
			refresh(form);
		});
		box.querySelector('#klang-captcha-img').addEventListener('error', function () {
			showError(form, '验证码暂时取不到，等几秒再换一张');
		});
		form.addEventListener('click', function (ev) {
			var target = ev.target && ev.target.closest ? ev.target.closest('#register') : null;
			if (!target || !form.contains(target)) {
				return;
			}
			var input = form.querySelector('#klang-captcha');
			if (input && /^\d{4}$/.test(input.value.trim())) {
				return;
			}
			ev.preventDefault();
			ev.stopPropagation();
			showError(form, '请填写图中的四位数字');
			if (input) {
				input.focus();
			}
		}, true);
		refresh(form);
	}

	function watchErrors() {
		if (window.__klangCaptchaWatch || !window.jQuery) {
			return;
		}
		window.__klangCaptchaWatch = true;
		window.jQuery(document).ajaxComplete(function (_event, _xhr, settings) {
			var url = (settings && settings.url) || '';
			if (url.indexOf('/register') === -1 || url.indexOf('/register/complete') !== -1) {
				return;
			}
			var form = document.querySelector('[component="register/local"]');
			if (form) {
				refresh(form);
			}
		});
	}

	function boot() {
		watchErrors();
		mount();
		if (window.jQuery) {
			window.jQuery(window).on('action:ajaxify.end', mount);
		}
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', boot);
	} else {
		boot();
	}
}());
