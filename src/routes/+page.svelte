<script lang="ts">
	import { onMount } from 'svelte';
	import { writable, type Writable } from 'svelte/store';
	import BrandGithub from '@tabler/icons-svelte/icons/brand-github';
	import Mail from '@tabler/icons-svelte/icons/mail';
	import BrandInstagram from '@tabler/icons-svelte/icons/brand-instagram';
	import { IconLink } from '@tabler/icons-svelte';

	type Locale = 'ko' | 'en' | 'ja';
	type ProjectStatus = 'current' | 'preserved' | 'paused';

	interface Translation {
		title: string;
		subtitle: string;
		projects: string;
		contact: string;
		technologies: string;
		frontend: string;
		backend: string;
		copyright: string;
		scroll: string;
		current: string;
		preserved: string;
		paused: string;
		solo: string;
	}

	interface ProjectTranslation {
		title: string;
		description: string;
		role: string;
		category: string;
		team?: string;
	}

	interface Project {
		title: string;
		year: string;
		category: string;
		team?: string;
		role: string;
		tech: string[];
		link?: string;
		status: ProjectStatus;
		image?: string;
	}

	const locale: Writable<Locale> = writable('ko');

	const translations: Record<Locale, Translation> = {
		ko: {
			title: 'JinPyo Joo',
			subtitle:
				'고양이와 심플한 디자인을 사랑하는 풀스택 웹 개발자입니다. 최적화와 디자인에 대해 공부하고 있습니다.',
			projects: 'PROJECTS',
			contact: 'CONTACT',
			technologies: 'TECHNOLOGIES',
			frontend: 'FRONTEND',
			backend: 'BACKEND & TOOLS',
			copyright: 'Copyright 2025. JinpyoJoo. Designed by JinPyoJoo in Daejeon, South Korea.',
			scroll: 'SCROLL',
			current: '현재',
			preserved: '보존',
			paused: '보류',
			solo: 'Solo Project'
		},
		en: {
			title: 'JinPyo Joo',
			subtitle:
				'A full stack web developer who loves cats and simple design. Currently studying optimization and design.',
			projects: 'PROJECTS',
			contact: 'CONTACT',
			technologies: 'TECHNOLOGIES',
			frontend: 'FRONTEND',
			backend: 'BACKEND & TOOLS',
			copyright: 'Copyright 2025. JinpyoJoo. Designed by JinPyoJoo in Daejeon, South Korea.',
			scroll: 'SCROLL',
			current: 'Current',
			preserved: 'Preserved',
			paused: 'Paused',
			solo: 'Solo Project'
		},
		ja: {
			title: 'JinPyo Joo',
			subtitle:
				'猫を愛し、シンプルなデザインを好むフルスタック Web デベロッパー。現在、最適化とデザインを勉強しています。',
			projects: 'PROJECTS',
			contact: 'CONTACT',
			technologies: 'TECHNOLOGIES',
			frontend: 'FRONTEND',
			backend: 'BACKEND & TOOLS',
			copyright: 'Copyright 2025. JinpyoJoo. Designed by JinPyoJoo in Daejeon, South Korea.',
			scroll: 'SCROLL',
			current: '現在',
			preserved: '保存',
			paused: '一時停止',
			solo: 'ソロプロジェクト'
		}
	};

	const projectTranslations: Record<Locale, Record<string, ProjectTranslation>> = {
		ko: {
			'Cat.Fluffy.Company': {
				title: 'Cat.Fluffy.Company',
				description:
					'고양이가 되었다고 생각하면서 성격을 검사할 수 있는 간단한 성격 검사 사이트입니다.',
				role: '풀스택 개발자 / 디자이너',
				category: '웹 애플리케이션',
				team: 'FluffyCompany'
			},
			'FURPIC (퍼픽)': {
				title: 'FURPIC (퍼픽)',
				description:
					'Svelte 프레임워크와 NestJS 기반의 백엔드로 구축된 서브컬쳐 사진 공유 플랫폼으로 사진 촬영자와 피사체 간 정보를 연결해 공유할 수 있는 플랫폼입니다. 현재 900개 이상의 캐릭터 데이터와 하루 접속자 1.7K 이상의 유저풀을 보유하고 있습니다.',
				role: '프론트엔드 개발자 / 디자이너 / 대외 담당 및 마케팅',
				category: '웹 애플리케이션',
				team: 'FURPIC TEAM'
			},
			마쵸봇: {
				title: '마쵸봇',
				description:
					'1분마다 주가가 변동하는 가상 주식게임을 즐길 수 있는 디스코드 기반 게임 챗봇입니다. 수천명 이상의 유저풀과 함께 경쟁하며 게임을 플레이할 수 있습니다.',
				role: 'PD / 프로젝트 리더 / 백엔드 개발자',
				category: '챗봇',
				team: '팀 큐빗 (FluffyCompany)'
			},
			'중앙서버 기반 RAW 이미지 편집 소프트웨어': {
				title: '중앙서버 기반 RAW 이미지 편집 소프트웨어',
				description:
					'전문 사진사와 일반인 모두 사용 가능한 RAW 이미지 편집기로 서버에서 연산을 처리하여 어디서든지 빠른 속도와 가벼움을 보장하는 프로토콜 기반 보정 소프트웨어입니다.',
				role: '프로젝트 매니저 / 풀스택 개발자',
				category: '데스크톱 소프트웨어'
			},
			'HNU BUS': {
				title: 'HNU BUS',
				description: '한남대학교 셔틀 버스를 편하게 이용하게 해주는 웹사이트입니다.',
				role: '풀스택 개발자',
				category: '웹 애플리케이션'
			}
		},
		en: {
			'Cat.Fluffy.Company': {
				title: 'Cat.Fluffy.Company',
				description:
					'A simple personality test site where you can take a personality test while imagining yourself as a cat.',
				role: 'Fullstack Developer / Designer',
				category: 'Web Application',
				team: 'FluffyCompany'
			},
			'FURPIC (퍼픽)': {
				title: 'FURPIC',
				description:
					'A subculture photo sharing platform built with Svelte framework and NestJS backend that connects information between photographers and subjects. Currently holds over 900 character data and a user pool of over 1.7K daily visitors.',
				role: 'Frontend Developer / Designer / External Relations & Marketing',
				category: 'Web Application',
				team: 'FURPIC TEAM'
			},
			마쵸봇: {
				title: 'MachoBot',
				description:
					'A Discord-based game chatbot where you can enjoy a virtual stock game with stock prices changing every minute. You can compete and play games with thousands of users.',
				role: 'PD / Project Leader / Backend Developer',
				category: 'Chatbot',
				team: 'Team Qubit (FluffyCompany)'
			},
			'HNU BUS': {
				title: 'HNU BUS',
				description: 'A website that makes it easy to use the Hannam University shuttle bus.',
				role: 'Fullstack Developer',
				category: 'Web Application'
			}
		},
		ja: {
			'Cat.Fluffy.Company': {
				title: 'Cat.Fluffy.Company',
				description: '猫になったと思いながら性格検査ができるシンプルな性格検査サイトです。',
				role: 'フルスタック開発者 / デザイナー',
				category: 'ウェブアプリケーション',
				team: 'FluffyCompany'
			},
			'FURPIC (퍼픽)': {
				title: 'FURPIC',
				description:
					'SvelteフレームワークとNestJSベースのバックエンドで構築されたサブカルチャー写真共有プラットフォームで、写真撮影者と被写体間の情報を接続して共有できるプラットフォームです。現在900以上のキャラクターデータと1日のアクセス者1.7K以上のユーザープールを保有しています。',
				role: 'フロントエンド開発者 / デザイナー / 対外担当およびマーケティング',
				category: 'ウェブアプリケーション',
				team: 'FURPIC TEAM'
			},
			마쵸봇: {
				title: 'マッチョボット',
				description:
					'1分ごとに株価が変動する仮想株式ゲームを楽しめるDiscordベースのゲームチャットボットです。数千人以上のユーザープールと一緒に競争しながらゲームをプレイできます。',
				role: 'PD / プロジェクトリーダー / バックエンド開発者',
				category: 'チャットボット',
				team: 'チーム キュービット (FluffyCompany)'
			},
			'HNU BUS': {
				title: 'HNU BUS',
				description: '漢南大学のシャトルバスを便利に利用できるウェブサイトです。',
				role: 'フルスタック開発者',
				category: 'ウェブアプリケーション'
			}
		}
	};

	$: t = translations[$locale];
	$: pt = projectTranslations[$locale];

	const projects: Project[] = [
		{
			title: 'HNU BUS',
			year: '2025',
			category: '웹 애플리케이션',
			role: '풀스택 개발자',
			tech: ['SVELTEKIT', 'TYPESCRIPT', 'TAILWINDCSS'],
			link: 'https://hnubus.ai.ai.kr',
			status: 'current',
			image: 'product_hnubus.png'
		},
		{
			title: 'Cat.Fluffy.Company',
			year: '2025',
			category: '웹 애플리케이션',
			team: 'FluffyCompany',
			role: '풀스택 개발자 / 디자이너',
			tech: ['SVELTE', 'TAILWINDCSS', 'CI/CD'],
			link: 'https://cat.fluffy.company',
			status: 'current',
			image: 'product_catff.png'
		},
		{
			title: 'FURPIC (퍼픽)',
			team: 'FURPIC TEAM',
			link: 'https://furpic.net',
			year: '2024',
			category: '웹 애플리케이션',
			role: '프론트엔드 개발자 / 디자이너 / 대외 담당 및 마케팅',
			tech: ['SVELTE', 'TYPESCRIPT', 'POSTGRESQL', 'TAILWINDCSS', 'FIGMA'],
			status: 'current',
			image: 'product_furpic.png'
		},
		{
			title: '마쵸봇',
			year: '2022',
			link: 'https://namu.wiki/w/마쵸봇',
			team: '팀 큐빗 (FluffyCompany)',
			category: '챗봇',
			role: 'PD / 프로젝트 리더 / 백엔드 개발자',
			tech: ['TYPESCRIPT', 'DISCORDJS', 'CANVAS', 'CI/CD'],
			status: 'current',
			image: 'product_chatbot.png'
		}
	];

	let titleElement: HTMLElement;
	let isVisible: boolean = false;
	let mouseX: number = 0;
	let mouseY: number = 0;

	function handleMouseMove(event: MouseEvent): void {
		mouseX = event.clientX;
		mouseY = event.clientY;
	}

	function setLocale(newLocale: Locale): void {
		locale.set(newLocale);
	}

	onMount((): (() => void) => {
		const vh: number = window.innerHeight * 0.01;
		document.documentElement.style.setProperty('--vh', `${vh}px`);

		const handleResize = (): void => {
			const vh: number = window.innerHeight * 0.01;
			document.documentElement.style.setProperty('--vh', `${vh}px`);
		};

		const timeoutId: number = setTimeout((): void => {
			isVisible = true;
		}, 800);

		window.addEventListener('resize', handleResize);
		window.addEventListener('orientationchange', (): void => {
			setTimeout(handleResize, 300);
		});
		window.addEventListener('mousemove', handleMouseMove);

		return (): void => {
			clearTimeout(timeoutId);
			window.removeEventListener('resize', handleResize);
			window.removeEventListener('orientationchange', handleResize);
			window.removeEventListener('mousemove', handleMouseMove);
		};
	});
</script>

<svelte:head>
	<title>JinPyo Joo - Web Developer</title>
	<meta
		name="description"
		content="Web Developer creating responsive and accessible applications"
	/>
	<meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1" />
</svelte:head>

<div
	class="min-h-screen-mobile relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-200"
>
	<div class="floating-paws">
		<div class="paw paw-1">🐾</div>
		<div class="paw paw-2">🐾</div>
		<div class="paw paw-3">🐾</div>
		<div class="paw paw-4">🐾</div>
		<div class="paw paw-5">🐾</div>
	</div>

	<div class="absolute top-4 right-4 left-4 md:top-8 md:right-8 md:left-8">
		<div class="h-0.5 w-full bg-black"></div>
	</div>

	<div class="absolute top-4 right-4 z-10 md:top-8 md:right-8">
		<div class="language-switcher flex gap-2">
			<button
				class="lang-btn text-xs font-medium tracking-wide text-black transition-all duration-300 hover:scale-110"
				class:active={$locale === 'ko'}
				on:click={() => setLocale('ko')}
			>
				KO
			</button>
			<button
				class="lang-btn text-xs font-medium tracking-wide text-black transition-all duration-300 hover:scale-110"
				class:active={$locale === 'en'}
				on:click={() => setLocale('en')}
			>
				EN
			</button>
			<button
				class="lang-btn text-xs font-medium tracking-wide text-black transition-all duration-300 hover:scale-110"
				class:active={$locale === 'ja'}
				on:click={() => setLocale('ja')}
			>
				JA
			</button>
		</div>
	</div>

	<div class="min-h-screen-mobile flex items-center justify-center px-4">
		<div class="animate-fade-in relative text-center">
			<h1
				bind:this={titleElement}
				class="cat-title mb-6 text-4xl font-black tracking-tight text-black md:mb-8 md:text-6xl lg:text-8xl"
				class:title-bounce={isVisible}
				style="--mouse-x: {mouseX}px; --mouse-y: {mouseY}px;"
			>
				<span class="letter letter-j">J</span><span class="letter letter-i">i</span><span
					class="letter letter-n">n</span
				><span class="letter letter-p">P</span><span class="letter letter-y">y</span><span
					class="letter letter-o">o</span
				><span class="letter letter-space"> </span><span class="letter letter-j2">J</span><span
					class="letter letter-o2">o</span
				><span class="letter letter-o3">o</span>
			</h1>

			<p class="mb-8 px-4 text-lg font-medium tracking-wide text-black md:mb-12 md:text-xl">
				{t.subtitle}
			</p>

			<div class="flex justify-center gap-8 md:gap-12">
				<a
					href="https://github.com/jookettle"
					target="_blank"
					rel="noopener noreferrer"
					class="social-link text-black transition-all duration-300 hover:scale-110 hover:rotate-12"
				>
					<BrandGithub size={24} />
				</a>
				<a
					href="mailto:wnwlsvy0914@gmail.com"
					target="_blank"
					rel="noopener noreferrer"
					class="social-link text-black transition-all duration-300 hover:scale-110 hover:rotate-12"
				>
					<Mail size={24} />
				</a>
				<a
					href="https://instagram.com/tsunagite_"
					target="_blank"
					rel="noopener noreferrer"
					class="social-link text-black transition-all duration-300 hover:scale-110 hover:rotate-12"
				>
					<BrandInstagram size={24} />
				</a>
			</div>
		</div>
	</div>

	<div class="absolute right-4 bottom-4 left-4 md:right-8 md:bottom-8 md:left-8">
		<div class="h-0.5 w-full bg-black"></div>
	</div>

	<div class="absolute bottom-12 left-1/2 -translate-x-1/2 transform md:bottom-16">
		<div class="cat-tail-indicator">
			<div class="cat-tail"></div>
			<div class="text-xs font-medium tracking-widest text-black md:text-sm">{t.scroll}</div>
		</div>
	</div>
</div>

<div class="bg-gray-100">
	<section class="min-h-screen-mobile px-4 py-16 md:px-8 md:py-24">
		<div class="mb-16 md:mb-24">
			<div class="mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-center md:justify-between">
				<h2
					class="project-title text-3xl font-black tracking-tight text-black md:text-4xl lg:text-6xl"
				>
					{t.projects}
				</h2>
				<div class="text-sm font-medium text-black md:text-base">2018 — 2025</div>
			</div>
			<div class="h-0.5 w-full bg-black"></div>
		</div>

		<div class="mx-auto max-w-6xl space-y-12 md:space-y-16">
			{#each projects as project, index}
				<div class="group project-item" style="--delay: {index * 0.1}s">
					<div class="grid items-start gap-6 md:grid-cols-12 md:gap-8">
						<div class="md:col-span-1">
							<div class="project-number text-xl font-black text-black md:text-2xl">
								{String(index + 1).padStart(2, '0')}
								<span class="paw-print">🐾</span>
							</div>
						</div>

						<div class="md:col-span-6">
							<div class="mb-2 flex flex-wrap gap-2 md:gap-4">
								<span class="project-tag text-xs font-black tracking-wide text-black md:text-sm"
									>{pt[project.title]?.team || project.team || t.solo}</span
								>
								<span class="project-tag text-xs font-medium tracking-wide text-black md:text-sm"
									>{pt[project.title]?.category || project.category}</span
								>
								<span class="project-tag text-xs font-medium tracking-wide text-black md:text-sm"
									>{project.year}</span
								>
								<span class="project-tag text-xs font-medium tracking-wide text-black md:text-sm"
									>— {t[project.status]}</span
								>
							</div>
							<h3
								class="mb-2 text-xl font-black tracking-tight text-black transition-all duration-300 group-hover:scale-105 group-hover:opacity-60 md:text-2xl lg:text-3xl"
							>
								{#if project.link}
									<a
										href={project.link}
										target="_blank"
										rel="noopener noreferrer"
										class="border-b-1 transition hover:border-b-2"
									>
										{pt[project.title]?.title || project.title}
									</a>
									<IconLink
										size={16}
										class="ml-1 inline-block transition-transform duration-300 group-hover:scale-125"
									/>
								{:else}
									{pt[project.title]?.title || project.title}
								{/if}
							</h3>
							<div
								class="role-badge mb-4 inline-block rounded-full bg-gray-200 px-3 py-1 text-xs font-medium text-gray-700 md:text-sm"
							>
								{pt[project.title]?.role || project.role}
							</div>
							<p class="mb-6 max-w-lg text-sm leading-relaxed text-black md:text-base">
								{pt[project.title]?.description || ''}
							</p>
							<div class="flex flex-wrap gap-3 md:gap-4">
								{#each project.tech as tech}
									<span
										class="tech-tag border-b border-black pb-1 text-xs font-medium tracking-wide text-black md:text-sm"
									>
										{tech}
									</span>
								{/each}
							</div>
						</div>

						<div class="md:col-span-5">
							<div
								class="project-box aspect-[4/3] border border-black bg-white transition-all duration-300 group-hover:bg-gray-50 group-hover:shadow-lg"
							>
								{#if project.image}
									<img
										src={project.image}
										alt={pt[project.title]?.title || project.title}
										class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
										loading="lazy"
									/>
								{:else}
									<div class="flex h-full w-full items-center justify-center">
										<div class="cat-in-box text-center">
											<div
												class="cat-placeholder mx-auto mb-4 h-12 w-12 border-2 border-black md:h-16 md:w-16"
											>
												<div class="cat-face">
													<div class="cat-whiskers">
														<div class="whisker whisker-1"></div>
														<div class="whisker whisker-2"></div>
														<div class="whisker whisker-3"></div>
														<div class="whisker whisker-4"></div>
													</div>
												</div>
											</div>
										</div>
									</div>
								{/if}
							</div>
						</div>
					</div>

					{#if index < projects.length - 1}
						<div class="mt-12 h-0.5 w-full bg-black md:mt-16"></div>
					{/if}
				</div>
			{/each}
		</div>
	</section>

	<section class="px-4 py-16 md:px-8 md:py-24">
		<div class="mx-auto max-w-6xl">
			<div class="grid gap-12 md:grid-cols-2 md:gap-16">
				<div>
					<h2
						class="contact-title mb-6 text-3xl font-black tracking-tight text-black md:mb-8 md:text-4xl lg:text-6xl"
					>
						{t.contact}
					</h2>
					<div class="space-y-4 md:space-y-6">
						<div class="contact-item">
							<div class="mb-2 text-xs font-medium tracking-wide text-black md:text-sm">EMAIL</div>
							<a
								href="mailto:wnwlsvy0914@gmail.com"
								class="text-lg font-medium break-all text-black transition-all duration-300 hover:scale-105 hover:opacity-60 md:text-xl"
							>
								wnwlsvy0914@gmail.com
							</a>
						</div>
						<div class="contact-item">
							<div class="mb-2 text-xs font-medium tracking-wide text-black md:text-sm">GITHUB</div>
							<a
								href="https://github.com/jookettle"
								target="_blank"
								rel="noopener noreferrer"
								class="text-lg font-medium text-black transition-all duration-300 hover:scale-105 hover:opacity-60 md:text-xl"
							>
								@jookettle
							</a>
						</div>
						<div class="contact-item">
							<div class="mb-2 text-xs font-medium tracking-wide text-black md:text-sm">
								INSTAGRAM
							</div>
							<a
								href="https://instagram.com/tsunagite_"
								target="_blank"
								rel="noopener noreferrer"
								class="text-lg font-medium text-black transition-all duration-300 hover:scale-105 hover:opacity-60 md:text-xl"
							>
								@TSUNAGITE_
							</a>
						</div>
					</div>
				</div>

				<div>
					<h3
						class="tech-title mb-6 text-xl font-black tracking-tight text-black md:mb-8 md:text-2xl"
					>
						{t.technologies}
					</h3>
					<div class="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
						<div class="tech-section">
							<div class="mb-3 text-xs font-medium tracking-wide text-black md:mb-4 md:text-sm">
								{t.frontend}
							</div>
							<div class="space-y-1 md:space-y-2">
								<div class="tech-item text-sm text-black md:text-base">SVELTE</div>
								<div class="tech-item text-sm text-black md:text-base">TYPESCRIPT</div>
								<div class="tech-item text-sm text-black md:text-base">TAILWIND CSS</div>
								<div class="tech-item text-sm text-black md:text-base">HTML5/CSS3</div>
							</div>
						</div>
						<div class="tech-section">
							<div class="mb-3 text-xs font-medium tracking-wide text-black md:mb-4 md:text-sm">
								{t.backend}
							</div>
							<div class="space-y-1 md:space-y-2">
								<div class="tech-item text-sm text-black md:text-base">POSTGRESQL</div>
								<div class="tech-item text-sm text-black md:text-base">PYTHON</div>
								<div class="tech-item text-sm text-black md:text-base">DISCORD.JS</div>
								<div class="tech-item text-sm text-black md:text-base">MACHINE LEARNING</div>
								<div class="tech-item text-sm text-black md:text-base">LINUX</div>
								<div class="tech-item text-sm text-black md:text-base">DOCKER</div>
								<div class="tech-item text-sm text-black md:text-base">FIGMA</div>
								<div class="tech-item text-sm text-black md:text-base">NETWORK ENGINEERING</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="mt-16 h-0.5 w-full bg-black md:mt-24"></div>
		<div class="mt-6 text-center md:mt-8">
			<div class="footer-text text-xs font-medium text-black md:text-sm">
				{t.copyright}
			</div>
		</div>
	</section>
</div>

<style>
	:global(html, body) {
		overflow-x: hidden;
		-webkit-overflow-scrolling: touch;
		margin: 0;
		padding: 0;
		box-sizing: border-box;
	}

	:global(*) {
		box-sizing: border-box;
	}

	.min-h-screen-mobile {
		min-height: 100vh;
		min-height: calc(var(--vh, 1vh) * 100);
	}

	@keyframes fade-in {
		from {
			opacity: 0;
			transform: translateY(-20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.animate-fade-in {
		animation: fade-in 1.2s ease-out;
	}

	.floating-paws {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		z-index: 1;
	}

	.paw {
		position: absolute;
		font-size: 20px;
		opacity: 0.3;
		animation: float 8s ease-in-out infinite;
	}

	.paw-1 {
		top: 20%;
		left: 10%;
		animation-delay: 0s;
	}
	.paw-2 {
		top: 40%;
		right: 15%;
		animation-delay: 2s;
	}
	.paw-3 {
		top: 60%;
		left: 20%;
		animation-delay: 4s;
	}
	.paw-4 {
		top: 80%;
		right: 25%;
		animation-delay: 6s;
	}
	.paw-5 {
		top: 30%;
		left: 70%;
		animation-delay: 1s;
	}

	@keyframes float {
		0%,
		100% {
			transform: translateY(0px) rotate(0deg);
		}
		25% {
			transform: translateY(-10px) rotate(5deg);
		}
		50% {
			transform: translateY(-20px) rotate(-5deg);
		}
		75% {
			transform: translateY(-10px) rotate(3deg);
		}
	}

	@keyframes wiggle {
		0%,
		100% {
			transform: translateX(-50%) rotate(0deg);
		}
		25% {
			transform: translateX(-50%) rotate(-2deg);
		}
		75% {
			transform: translateX(-50%) rotate(2deg);
		}
	}

	.cat-title {
		position: relative;
		z-index: 5;
	}

	.letter {
		display: inline-block;
		transition: all 0.3s ease;
	}

	.title-bounce .letter {
		animation: letterBounce 2s ease-in-out infinite;
	}

	.title-bounce .letter-j {
		animation-delay: 0s;
	}
	.title-bounce .letter-i {
		animation-delay: 0.1s;
	}
	.title-bounce .letter-n {
		animation-delay: 0.2s;
	}
	.title-bounce .letter-p {
		animation-delay: 0.3s;
	}
	.title-bounce .letter-y {
		animation-delay: 0.4s;
	}
	.title-bounce .letter-o {
		animation-delay: 0.5s;
	}
	.title-bounce .letter-space {
		animation-delay: 0.6s;
	}
	.title-bounce .letter-j2 {
		animation-delay: 0.7s;
	}
	.title-bounce .letter-o2 {
		animation-delay: 0.8s;
	}
	.title-bounce .letter-o3 {
		animation-delay: 0.9s;
	}

	@keyframes letterBounce {
		0%,
		100% {
			transform: translateY(0px) scale(1);
		}
		50% {
			transform: translateY(-10px) scale(1.05);
		}
	}

	@keyframes blink {
		0%,
		90%,
		100% {
			transform: translate(-50%, -50%) scaleY(1);
		}
		95% {
			transform: translate(-50%, -50%) scaleY(0.1);
		}
	}

	.social-link:hover {
		filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
	}

	.cat-tail-indicator {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10px;
	}

	.cat-tail {
		width: 3px;
		height: 30px;
		background: #333;
		border-radius: 3px;
		animation: tailWag 2s ease-in-out infinite;
		transform-origin: top center;
	}

	@keyframes tailWag {
		0%,
		100% {
			transform: rotate(0deg);
		}
		25% {
			transform: rotate(10deg);
		}
		75% {
			transform: rotate(-10deg);
		}
	}

	.project-item {
		opacity: 0;
		transform: translateY(30px);
		animation: slideInUp 0.8s ease-out forwards;
		animation-delay: var(--delay);
	}

	@keyframes slideInUp {
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.project-number {
		position: relative;
	}

	.paw-print {
		position: absolute;
		top: -5px;
		right: -15px;
		font-size: 12px;
		opacity: 0;
		transition: all 0.3s ease;
	}

	.project-item:hover .paw-print {
		opacity: 1;
		transform: rotate(15deg);
	}

	.project-tag {
		transition: all 0.3s ease;
	}

	.project-tag:hover {
		background: rgba(0, 0, 0, 0.1);
		padding: 2px 6px;
		border-radius: 4px;
	}

	.role-badge {
		transition: all 0.3s ease;
	}

	.role-badge:hover {
		background: #333;
		color: white;
		transform: scale(1.05);
	}

	.tech-tag {
		transition: all 0.3s ease;
		position: relative;
	}

	.tech-tag:hover {
		border-color: #666;
		transform: translateY(-2px);
	}

	.project-box {
		position: relative;
		overflow: hidden;
	}

	.cat-in-box {
		transition: all 0.3s ease;
	}

	.project-item:hover .cat-in-box {
		transform: scale(1.1);
	}

	.cat-placeholder {
		position: relative;
		transition: all 0.3s ease;
	}

	.cat-face {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
	}

	.cat-whiskers {
		position: relative;
		width: 40px;
		height: 20px;
	}

	.whisker {
		position: absolute;
		width: 15px;
		height: 1px;
		background: #333;
		border-radius: 1px;
	}

	.whisker-1 {
		top: 8px;
		left: -5px;
		transform: rotate(-20deg);
	}
	.whisker-2 {
		top: 12px;
		left: -5px;
		transform: rotate(20deg);
	}
	.whisker-3 {
		top: 8px;
		right: -5px;
		transform: rotate(20deg);
	}
	.whisker-4 {
		top: 12px;
		right: -5px;
		transform: rotate(-20deg);
	}

	.contact-item {
		transition: all 0.3s ease;
	}

	.contact-item:hover {
		transform: translateX(10px);
	}

	.tech-section {
		transition: all 0.3s ease;
	}

	.tech-section:hover {
		transform: translateY(-5px);
	}

	.tech-item {
		transition: all 0.3s ease;
		cursor: pointer;
	}

	.tech-item:hover {
		color: #666;
		transform: translateX(5px);
	}

	.project-title,
	.contact-title,
	.tech-title {
		transition: all 0.3s ease;
	}

	.project-title:hover,
	.contact-title:hover,
	.tech-title:hover {
		transform: scale(1.02);
		text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
	}

	.footer-text {
		position: relative;
	}

	.language-switcher {
		position: relative;
		z-index: 10;
	}

	.lang-btn {
		margin-top: 20px;
		padding: 4px 8px;
		/* border: 1px solid transparent; */
		border-radius: 4px;
		cursor: pointer;
		background: transparent;
	}

	.lang-btn:hover {
		background: rgba(0, 0, 0, 0.1);
	}

	.lang-btn.active {
		border-color: #333;
		background: rgba(0, 0, 0, 0.1);
		font-weight: bold;
	}

	@keyframes catWave {
		0%,
		100% {
			transform: rotate(0deg);
		}
		25% {
			transform: rotate(10deg);
		}
		75% {
			transform: rotate(-10deg);
		}
	}

	@media (hover: none) and (pointer: coarse) {
		.group:hover .group-hover\:opacity-60 {
			opacity: 1;
		}

		.group:hover .group-hover\:bg-gray-50 {
			background-color: white;
		}

		.title-bounce .letter {
			animation: letterBounce 3s ease-in-out infinite;
		}
	}

	@media (max-width: 768px) {
		.floating-paws .paw {
			font-size: 16px;
		}
	}
</style>
