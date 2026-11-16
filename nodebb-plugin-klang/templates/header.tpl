<!DOCTYPE html>
<html lang="{localeToHTML(userLang, defaultLang)}" {{{if languageDirection}}}data-dir="{languageDirection}" style="direction: {languageDirection};"{{{end}}}>
<head>
	<title>{browserTitle}</title>
	{{{each metaTags}}}{{buildMetaTag(@value)}}{{{end}}}
	<link rel="stylesheet" type="text/css" href="{relative_path}/assets/client{{{if bootswatchSkin}}}-{bootswatchSkin}{{{end}}}{{{ if (languageDirection=="rtl") }}}-rtl{{{ end }}}.css?{config.cache-buster}" />
	{{{each linkTags}}}{{buildLinkTag(@value)}}{{{end}}}
	<script>
		var config = JSON.parse('{{configJSON}}');
		var app = { user: JSON.parse('{{userJSON}}') };
		document.documentElement.style.setProperty('--panel-offset', '52px');
		(function () {
			try {
				var saved = localStorage.getItem('klang-theme');
				var dark = saved === 'dark';
				if (dark) {
					document.documentElement.classList.add('dark');
					document.documentElement.setAttribute('data-bs-theme', 'dark');
				}
			} catch (e) {}
		})();
	</script>
	{{{if useCustomHTML}}}
	{{customHTML}}
	{{{end}}}
	{{{if useCustomCSS}}}
	<style>{{customCSS}}</style>
	{{{end}}}
	<style>body.klang-body #klangTopbar{z-index:1040 !important;overflow:visible}body.klang-body #klangTopbar>div{overflow:visible}</style>
</head>

<body class="{bodyClass} skin-{{{if bootswatchSkin}}}{bootswatchSkin}{{{else}}}noskin{{{end}}} klang-body">
	<a class="skip" href="#content">跳到内容</a>

	<header class="tw-sticky tw-top-0 tw-z-30 tw-border-b tw-border-line" id="klangTopbar">
		<div class="tw-mx-auto tw-flex tw-h-[52px] tw-max-w-6xl tw-items-center tw-gap-6 tw-px-5">
			<a class="tw-flex tw-shrink-0 tw-items-center tw-gap-2 tw-text-ink tw-no-underline" href="{relative_path}/">
				<span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i></span>
				<span class="tw-text-[15px] tw-font-semibold tw-tracking-tight">Klang</span>
			</a>
			<nav class="tw-hidden tw-items-center tw-gap-4 min-[900px]:tw-flex" aria-label="主导航">
				<a href="{relative_path}/" class="tw-text-[13px] tw-no-underline hover:tw-text-ink {{{ if (template.klang-home || template.home) }}}tw-font-medium tw-text-ink{{{ else }}}tw-text-muted{{{ end }}}">首页</a>
				<a href="{relative_path}/categories" class="tw-text-[13px] tw-no-underline hover:tw-text-ink {{{ if template.categories }}}tw-font-medium tw-text-ink{{{ else }}}tw-text-muted{{{ end }}}">版块</a>
				<a href="{relative_path}/recent" class="tw-text-[13px] tw-no-underline hover:tw-text-ink {{{ if template.recent }}}tw-font-medium tw-text-ink{{{ else }}}tw-text-muted{{{ end }}}">最新</a>
				<a href="{relative_path}/popular" class="tw-text-[13px] tw-no-underline hover:tw-text-ink {{{ if template.popular }}}tw-font-medium tw-text-ink{{{ else }}}tw-text-muted{{{ end }}}">热门</a>
				<a href="{relative_path}/tags" class="tw-text-[13px] tw-no-underline hover:tw-text-ink {{{ if template.tags }}}tw-font-medium tw-text-ink{{{ else }}}tw-text-muted{{{ end }}}">标签</a>
				<a href="https://klang.org.cn/" class="tw-text-[13px] tw-text-muted tw-no-underline hover:tw-text-ink" rel="noopener noreferrer">文档</a>
			</nav>
			<form class="tw-ml-auto tw-flex tw-h-8 tw-min-w-0 tw-flex-1 tw-max-w-[220px] tw-items-center tw-gap-2 tw-rounded-md tw-border tw-border-line tw-bg-transparent tw-px-2.5" action="{relative_path}/search" method="get" role="search">
				<svg class="tw-h-3.5 tw-w-3.5 tw-shrink-0 tw-text-faint" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M16.5 16.5 21 21" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>
				<input class="tw-w-full tw-border-0 tw-bg-transparent tw-text-[13px] tw-text-ink tw-outline-none placeholder:tw-text-faint" type="search" name="term" placeholder="搜索" aria-label="搜索" value="{search_query}">
				<input type="hidden" name="in" value="titlesposts">
			</form>
			<div class="tw-flex tw-shrink-0 tw-items-center tw-gap-1">
				<button class="icon-btn tw-relative tw-inline-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-rounded-md tw-text-muted hover:tw-text-ink" id="klangThemeBtn" type="button" aria-label="切换深浅色" aria-pressed="false">
					<svg class="tw-h-4 tw-w-4" viewBox="0 0 24 24" aria-hidden="true">
						<g class="ico-sun" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/></g>
						<path class="ico-moon" d="M20 14.6A7.2 7.2 0 0 1 9.4 4 6.4 6.4 0 1 0 20 14.6z" fill="currentColor"/>
					</svg>
				</button>
				{{{ if config.loggedIn }}}
				<a class="icon-btn tw-relative tw-inline-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-rounded-md tw-text-muted tw-no-underline hover:tw-text-ink" href="{relative_path}/notifications" aria-label="通知">
					<svg class="tw-h-4 tw-w-4" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 9a6 6 0 1 1 12 0c0 7 3 7 3 7H3s3 0 3-7"/><path d="M10 18a2 2 0 0 0 4 0"/></svg>
					<span component="notifications/count" class="notif-badge tw-absolute -tw-right-1 -tw-top-1 tw-min-w-4 tw-rounded-full tw-bg-accent tw-px-1 tw-text-center tw-text-[10px] tw-leading-4 tw-text-white {{{ if !unreadCount.notification }}}hidden{{{ end }}}">{unreadCount.notification}</span>
				</a>
				<details class="tw-relative">
					<summary class="tw-flex tw-h-8 tw-cursor-pointer tw-list-none tw-items-center tw-px-2 tw-text-[13px] tw-font-medium tw-text-ink">{user.username}</summary>
					<div class="tw-absolute tw-right-0 tw-top-11 tw-z-40 tw-flex tw-min-w-36 tw-flex-col tw-rounded-xl tw-bg-card tw-p-1 tw-shadow-card tw-ring-1 tw-ring-line">
						<a class="tw-rounded-lg tw-px-3 tw-py-1.5 tw-text-sm tw-text-ink tw-no-underline hover:tw-bg-soft" href="{relative_path}/user/{user.userslug}">个人主页</a>
						<a class="tw-rounded-lg tw-px-3 tw-py-1.5 tw-text-sm tw-text-ink tw-no-underline hover:tw-bg-soft" href="{relative_path}/chats">私信</a>
						<a class="tw-rounded-lg tw-px-3 tw-py-1.5 tw-text-sm tw-text-ink tw-no-underline hover:tw-bg-soft" href="{relative_path}/notifications">通知</a>
						{{{ if isAdmin }}}
						<a class="tw-rounded-lg tw-px-3 tw-py-1.5 tw-text-sm tw-text-ink tw-no-underline hover:tw-bg-soft" href="{relative_path}/admin">管理后台</a>
						{{{ end }}}
						<div component="user/logout">
							<form method="post" action="{relative_path}/logout">
								<input type="hidden" name="_csrf" value="{config.csrf_token}">
								<input type="hidden" name="noscript" value="true">
								<button type="submit" class="tw-w-full tw-cursor-pointer tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-3 tw-py-1.5 tw-text-left tw-text-sm tw-text-ink hover:tw-bg-soft">退出</button>
							</form>
						</div>
					</div>
				</details>
				{{{ else }}}
				<a class="tw-inline-flex tw-h-9 tw-items-center tw-rounded-full tw-bg-accent tw-px-4 tw-text-sm tw-text-white tw-no-underline hover:tw-bg-accent" href="{relative_path}/login">登录</a>
				{{{ end }}}
			</div>
		</div>
	</header>

	<main id="panel" class="tw-min-h-[calc(100vh-7rem)]">
		<div id="content" class="tw-mx-auto tw-w-full tw-max-w-6xl tw-px-5 tw-pb-16 tw-pt-6">
			<!-- IMPORT partials/noscript/warning.tpl -->
			<!-- IMPORT partials/noscript/message.tpl -->
