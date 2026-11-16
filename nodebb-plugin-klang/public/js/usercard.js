'use strict';

(function () {
	function place(card) {
		var anchor = card._klangAnchor;
		if (!anchor || !anchor.isConnected) {
			anchor = card.previousElementSibling || card.parentElement;
			card._klangAnchor = anchor;
		}
		if (!anchor || !anchor.getBoundingClientRect) {
			return;
		}
		var rect = anchor.getBoundingClientRect();
		var width = Math.min(450, window.innerWidth - 16);
		var left = rect.left + window.scrollX;
		if (left + width > window.scrollX + window.innerWidth - 8) {
			left = window.scrollX + window.innerWidth - width - 8;
		}
		if (left < 8) {
			left = 8;
		}
		card.style.position = 'absolute';
		card.style.zIndex = '25';
		card.style.width = width + 'px';
		card.style.left = left + 'px';
		card.style.top = (rect.top + window.scrollY - 24) + 'px';
		card.style.margin = '0';
		if (card.parentElement !== document.body) {
			document.body.appendChild(card);
		}
	}

	function lift(records) {
		var found = false;
		records.forEach(function (record) {
			Array.prototype.forEach.call(record.addedNodes, function (node) {
				if (node.nodeType !== 1) {
					return;
				}
				if (node.classList.contains('persona-usercard') || (node.querySelector && node.querySelector('.persona-usercard'))) {
					found = true;
				}
			});
		});
		if (!found) {
			return;
		}
		requestAnimationFrame(function () {
			document.querySelectorAll('.persona-usercard').forEach(place);
		});
	}

	function boot() {
		if (window.__klangUsercard) {
			return;
		}
		window.__klangUsercard = true;
		new MutationObserver(lift).observe(document.body, { childList: true, subtree: true });
		window.addEventListener('resize', function () {
			document.querySelectorAll('.persona-usercard').forEach(place);
		});
	}

	if (document.body) {
		boot();
	} else {
		document.addEventListener('DOMContentLoaded', boot);
	}
}());
