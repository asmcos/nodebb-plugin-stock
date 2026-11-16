<div class="tw-pt-2">
	<div class="tw-flex tw-flex-wrap tw-items-baseline tw-gap-x-8 tw-gap-y-2" aria-label="指数">
		{{{ each quotes }}}
		<a class="idx {./cls}" href="{./url}" target="_blank" rel="noopener noreferrer">
			<span class="idx-name">{./name}</span>
			<span class="idx-px">{./price}</span>
			<span class="idx-chg">{./rise}</span>
		</a>
		{{{ end }}}
		{{{ if !quotesReady }}}
		<span class="tw-text-sm tw-text-muted">指数行情暂时取不到</span>
		{{{ end }}}
	</div>

	<p class="tw-mb-0 tw-mt-5 tw-text-[13px] tw-text-muted">{counts.topics} 个主题 · {counts.posts} 篇讨论 · {counts.users} 位成员{{{ if presence }}} · {presence}{{{ end }}}</p>

	{{{ if members.length }}}
	<div class="tw-mt-4 tw-flex tw-flex-wrap tw-items-center tw-gap-x-4 tw-gap-y-2" aria-label="版里的人">
		{{{ each members }}}
		<a class="tw-inline-flex tw-items-center tw-gap-1.5 tw-no-underline" href="{relative_path}/user/{./userslug}" title="{./label}">
			<span class="face face-sm face-{./hue}{{{ if ./online }}} is-online{{{ end }}}">
				{{{ if ./picture }}}
				<img src="{./picture}" alt="">
				{{{ else }}}
				{./initial}
				{{{ end }}}
			</span>
			<span class="tw-text-[13px] tw-text-ink">{./name}</span>
		</a>
		{{{ end }}}
	</div>
	{{{ end }}}

	<div class="tw-mt-5 tw-flex tw-items-center tw-gap-3 tw-border-b tw-border-line tw-py-4">
		{{{ if loggedIn }}}
		{{{ if me }}}
		<span class="face face-lg face-{me.hue}">
			{{{ if me.picture }}}
			<img src="{me.picture}" alt="">
			{{{ else }}}
			{me.initial}
			{{{ end }}}
		</span>
		{{{ end }}}
		<p class="tw-mb-0 tw-min-w-0 tw-flex-1 tw-text-[14px] tw-leading-6 tw-text-body">你在用哪套策略，或者今天看到了什么。写一句，会有人接。</p>
		{{{ if canPost }}}
		<button type="button" id="new_topic" class="tw-inline-flex tw-h-8 tw-shrink-0 tw-items-center tw-rounded-full tw-bg-accent tw-px-3.5 tw-text-[13px] tw-text-white" component="category/post">写一句</button>
		{{{ end }}}
		{{{ else }}}
		<p class="tw-mb-0 tw-min-w-0 tw-flex-1 tw-text-[14px] tw-leading-6 tw-text-body">这些帖里有人在来回接话。你也可以写一句。</p>
		<a class="tw-inline-flex tw-h-8 tw-shrink-0 tw-items-center tw-rounded-full tw-bg-accent tw-px-3.5 tw-text-[13px] tw-text-white tw-no-underline" href="{relative_path}/login">写一句</a>
		{{{ end }}}
	</div>

	<div class="tw-mt-7 tw-grid tw-items-start tw-gap-x-16 tw-gap-y-10 min-[900px]:tw-grid-cols-[minmax(0,1fr)_216px]">
		<section aria-label="讨论">
			{{{ if topics.length }}}
			<h2 class="tw-text-[12px] tw-font-medium tw-tracking-wide tw-text-faint">最新</h2>
			{{{ each topics }}}
			<article class="tw-flex tw-items-start tw-gap-3 tw-border-b tw-border-line tw-py-4">
				{{{ if ./user.userslug }}}
				<a class="face face-lg face-{./user.hue}" href="{relative_path}/user/{./user.userslug}" title="{./user.name}">
				{{{ else }}}
				<span class="face face-lg face-{./user.hue}">
				{{{ end }}}
					{{{ if ./user.picture }}}
					<img src="{./user.picture}" alt="">
					{{{ else }}}
					{./user.initial}
					{{{ end }}}
				{{{ if ./user.userslug }}}
				</a>
				{{{ else }}}
				</span>
				{{{ end }}}
				<div class="tw-min-w-0 tw-flex-1">
					<div class="tw-flex tw-items-baseline tw-gap-4">
						{{{ if ./pinned }}}<span class="tw-shrink-0 tw-text-[12px] tw-text-accent">置顶</span>{{{ end }}}
						<a class="tw-min-w-0 tw-flex-1 tw-text-[16px] tw-font-medium tw-leading-6 tw-tracking-tight tw-text-ink tw-no-underline hover:tw-underline hover:tw-underline-offset-4" href="{./url}">{./title}</a>
						<span class="tw-flex tw-shrink-0 tw-items-baseline tw-gap-3 tw-tabular-nums tw-text-[13px]" title="{./countTitle}">
							<span class="tw-text-faint"><span class="{{{ if ./replies }}}tw-font-medium tw-text-accent{{{ else }}}tw-text-ink{{{ end }}}">{./replies}</span> 回复</span>
							<span class="tw-text-faint"><span class="tw-text-ink">{./views}</span> 浏览</span>
						</span>
					</div>
					<div class="tw-mt-1 tw-flex tw-flex-wrap tw-items-center tw-gap-x-2 tw-text-[12px] tw-text-faint">
						{{{ if ./category.name }}}
						<a class="tw-inline-flex tw-items-center tw-text-muted tw-no-underline hover:tw-text-ink" href="{./category.link}">{{{ if ./category.color }}}<span class="cat-dot" style="background:{./category.color}"></span>{{{ end }}}{./category.name}</a>
						<span aria-hidden="true">·</span>
						{{{ end }}}
						{{{ if ./user.userslug }}}
						<a class="tw-no-underline hover:tw-text-ink" href="{relative_path}/user/{./user.userslug}">{./user.name}</a>
						{{{ else }}}
						<span>{./user.name}</span>
						{{{ end }}}
						<span aria-hidden="true">·</span>
						<span title="{./timestampISO}">{./when}</span>
						{{{ if ./replyFaces.length }}}
						<span class="voices voices-inline" title="{./replyNames}">
							{{{ each ./replyFaces }}}
							{{{ if ./userslug }}}
							<a class="face face-{./hue}" href="{relative_path}/user/{./userslug}" title="{./name}">
							{{{ else }}}
							<span class="face face-{./hue}" title="{./name}">
							{{{ end }}}
								{{{ if ./picture }}}
								<img src="{./picture}" alt="">
								{{{ else }}}
								{./initial}
								{{{ end }}}
							{{{ if ./userslug }}}
							</a>
							{{{ else }}}
							</span>
							{{{ end }}}
							{{{ end }}}
						</span>
						{{{ end }}}
					</div>
					{{{ if ./teaser.text }}}
					<p class="tw-mb-0 tw-mt-1 tw-line-clamp-1 tw-text-[13px] tw-leading-5 tw-text-muted">{{{ if ./teaser.other }}}<span class="tw-text-ink">{./teaser.name}：</span>{{{ end }}}{./teaser.text}</p>
					{{{ end }}}
				</div>
			</article>
			{{{ end }}}
			{{{ if recentPager.show }}}
			<nav class="tw-mt-5 tw-flex tw-items-center tw-gap-4 tw-text-[13px]" aria-label="最新翻页">
				{{{ if recentPager.prev }}}
				<a class="tw-text-muted tw-no-underline hover:tw-text-ink" href="{recentPager.prevUrl}">上一页</a>
				{{{ else }}}
				<span class="tw-text-faint">上一页</span>
				{{{ end }}}
				<span class="tw-tabular-nums tw-text-faint">{recentPager.page} / {recentPager.pages}</span>
				{{{ if recentPager.next }}}
				<a class="tw-text-muted tw-no-underline hover:tw-text-ink" href="{recentPager.nextUrl}">下一页</a>
				{{{ else }}}
				<span class="tw-text-faint">下一页</span>
				{{{ end }}}
			</nav>
			{{{ end }}}
			{{{ end }}}

			{{{ if square.length }}}
			<h2 class="tw-text-[12px] tw-font-medium tw-tracking-wide tw-text-faint{{{ if topics.length }}} tw-mt-8{{{ end }}}">聊得最开</h2>
			{{{ each square }}}
			<article class="tw-flex tw-items-start tw-gap-3 tw-border-b tw-border-line tw-py-4">
				<div class="voices">
					{{{ each ./voices }}}
					{{{ if ./userslug }}}
					<a class="face face-{./hue}" href="{relative_path}/user/{./userslug}" title="{./name}">
					{{{ else }}}
					<span class="face face-{./hue}">
					{{{ end }}}
						{{{ if ./picture }}}
						<img src="{./picture}" alt="">
						{{{ else }}}
						{./initial}
						{{{ end }}}
					{{{ if ./userslug }}}
					</a>
					{{{ else }}}
					</span>
					{{{ end }}}
					{{{ end }}}
				</div>
				<div class="tw-min-w-0 tw-flex-1">
					<div class="tw-flex tw-items-baseline tw-gap-4">
						<a class="tw-min-w-0 tw-flex-1 tw-text-[16px] tw-font-medium tw-leading-6 tw-tracking-tight tw-text-ink tw-no-underline hover:tw-underline hover:tw-underline-offset-4" href="{./url}">{./title}</a>
						<span class="tw-flex tw-shrink-0 tw-items-baseline tw-gap-3 tw-tabular-nums tw-text-[13px]" title="{./countTitle}">
							<span class="tw-text-faint"><span class="tw-font-medium tw-text-accent">{./replies}</span> 回复</span>
							<span class="tw-text-faint"><span class="tw-text-ink">{./views}</span> 浏览</span>
						</span>
					</div>
					<div class="tw-mt-1 tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-x-2 tw-text-[12px] tw-text-faint">
						{{{ if ./category.name }}}
						<a class="tw-inline-flex tw-items-center tw-text-muted tw-no-underline hover:tw-text-ink" href="{./category.link}">{{{ if ./category.color }}}<span class="cat-dot" style="background:{./category.color}"></span>{{{ end }}}{./category.name}</a>
						<span aria-hidden="true">·</span>
						{{{ end }}}
						<span class="tw-text-muted">{./voiceNames}</span>
						<span aria-hidden="true">·</span>
						<span title="{./timestampISO}">{./when}</span>
					</div>
					{{{ if ./teaser.text }}}
					<p class="tw-mb-0 tw-mt-1.5 tw-line-clamp-2 tw-text-[13px] tw-leading-6 tw-text-body">{{{ if ./teaser.other }}}<span class="tw-font-medium tw-text-ink">{./teaser.name}</span><span class="tw-text-muted">：</span>{{{ end }}}{./teaser.text}</p>
					{{{ end }}}
				</div>
			</article>
			{{{ end }}}
			{{{ if squarePager.show }}}
			<nav class="tw-mt-5 tw-flex tw-items-center tw-gap-4 tw-text-[13px]" aria-label="聊得最开翻页">
				{{{ if squarePager.prev }}}
				<a class="tw-text-muted tw-no-underline hover:tw-text-ink" href="{squarePager.prevUrl}">上一页</a>
				{{{ else }}}
				<span class="tw-text-faint">上一页</span>
				{{{ end }}}
				<span class="tw-tabular-nums tw-text-faint">{squarePager.page} / {squarePager.pages}</span>
				{{{ if squarePager.next }}}
				<a class="tw-text-muted tw-no-underline hover:tw-text-ink" href="{squarePager.nextUrl}">下一页</a>
				{{{ else }}}
				<span class="tw-text-faint">下一页</span>
				{{{ end }}}
			</nav>
			{{{ end }}}
			{{{ end }}}

			{{{ if !square.length }}}
			{{{ if !topics.length }}}
			<p class="tw-py-8 tw-text-sm tw-text-body">还没有帖子。版块开好之后，从这里开始写策略和复盘。</p>
			{{{ end }}}
			{{{ end }}}
		</section>

		<aside aria-label="版块">
			<h2 class="tw-mb-1 tw-text-[12px] tw-font-medium tw-tracking-wide tw-text-faint">版块</h2>
			{{{ each categories }}}
			<a class="tw-block tw-py-2 tw-text-ink tw-no-underline hover:tw-text-accent" href="{./link}">
				<span class="tw-flex tw-items-baseline tw-justify-between tw-gap-3">
					<span class="tw-inline-flex tw-min-w-0 tw-items-center tw-text-[14px] tw-leading-6">{{{ if ./color }}}<span class="cat-dot" style="background:{./color}"></span>{{{ end }}}{./name}</span>
					<span class="tw-tabular-nums tw-text-[12px] tw-text-faint">{./topicCount}</span>
				</span>
				{{{ if ./lastTitle }}}
				<span class="tw-mt-0.5 tw-block tw-truncate tw-pl-3 tw-text-[12px] tw-leading-5 tw-text-faint">{./lastTitle}</span>
				{{{ else }}}
				{{{ if ./description }}}
				<span class="tw-mt-0.5 tw-block tw-truncate tw-pl-3 tw-text-[12px] tw-leading-5 tw-text-faint">{./description}</span>
				{{{ end }}}
				{{{ end }}}
			</a>
			{{{ end }}}

			<p class="tw-mb-0 tw-mt-10 tw-text-[12px] tw-leading-5 tw-text-faint">帖子里写 sh600519，会带上现价和涨跌。</p>
		</aside>
	</div>
</div>
