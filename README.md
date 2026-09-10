### 자기 이력 홈페이지 만들기

- Github 링크 : https://github.com/jookettle/jookettle.github.io
- 본 사이트는 한남대학교 컴퓨터공학과 과제의 일환으로 제작되었습니다.
- 링크 : https://jookettle.github.io 또는 https://pf.ai.ai.kr (CNAME이 적용된 커스텀 도메인)

- 깃허브 페이지로 구현되어있으나(정적웹으로 빌드 후 접근 가능하게 되는 매커니즘) 자체 소유 도메인 활용하여 https://pf.ai.ai.kr 로 리다이렉트됩니다.
- CSS의 Transition과 hover 이벤트를 활용하여 부드러운 애니메이션 효과를 적극 활용하였습니다.

- 사용 스택 : NodeJS + TailwindCSS + Typescript + Sveltekit + Github Action Workflow
- 자바스크립트는 동적 타입언어이므로 이로 인한 버그를 예방하기 위해 Typescript라는 기술을 사용하였습니다.
- Svelte는 풀스택 대응 가능한 언어이나, Github Page를 사용하기 위해 정적으로 빌드폴더에 생성되도록 adapter 패키지를 추가적으로 설치하고, .github/workflow/deploy.yml 으로 커밋 즉시 깃허브 페이지로 배포되도록 구축하였습니다.
- code formatting 및 linting을 위해 prettier와 eslint를 사용하였습니다.
- 모바일 환경 최적화를 위해 반응형 웹으로 제작되었습니다.

- 템플릿을 사용하지 않고 처음부터 직접 제작하였습니다.
- 깃허브 액션으로 커밋 후 배포작업을 자동으로 진행하도록 되어있기 때문에 clone 후 index.html이 없기 때문에 사이트에서 접속하는 경우가 아닌 경우 정상적으로 사이트가 작동하지 않습니다.
- 사이트 내 링크된 프로젝트는 지금까지 제가 참여한 독자 제작 프로젝트와 팀 프로젝트가 함께 기입되어있습니다.



#### 1. 마크다운 기반 블로그

- src/content/posts/*.md 파일을 `import.meta.glob`으로 빌드 시점에 한번에 읽어들이고, gray-matter로 frontmatter를, marked로 본문 HTML을 생성합니다. (src/lib/blog.ts)
- frontmatter에 `visible: false`를 적은 글은 목록과 상세 페이지 양쪽에서 모두 제외되므로, 작성 중인 초안을 저장소에 두면서도 사이트에는 노출하지 않을 수 있습니다.
- 모든 페이지는 src/routes/+layout.server.ts의 `prerender = true` 설정으로 정적 생성되기 때문에 서버 없이 깃허브 페이지에서 동작합니다.

#### 2. 각주 툴팁 시스템

- 글의 제목이나 본문에 `(각주)`라고 적어두면 frontmatter의 `footnotes` 배열 순서대로 1) 2) 3) 번호가 매겨지고, 마우스를 올리거나 키보드 포커스를 주면 설명이 말풍선으로 표시됩니다.
- 치환 로직은 src/lib/blog.ts의 `applyFootnotes` 함수이고, 말풍선 디자인은 src/app.css의 `.fn-marker` / `.fn-tooltip` 규칙입니다.
- 화면에 보이는 번호(displayCounter)와 각주 배열의 인덱스(arrayIdx)를 각각 따로 넘기도록 설계했습니다. 덕분에 메인 페이지처럼 여러 글의 제목이 한 화면에 나열되는 상황에서도, 번호는 페이지 전체에서 끊기지 않고 이어지면서 각 카드는 자기 글의 각주 배열을 처음부터 참조합니다.
- 각주 표시에 `tabindex="0"`을 부여하여 마우스를 쓰기 어려운 환경에서도 키보드 포커스만으로 각주 내용을 확인할 수 있습니다.

#### 3. 제목이 넘칠 때만 동작하는 마퀴 애니메이션

- src/routes/+page.svelte의 `marquee` 액션은 요소의 scrollWidth와 offsetWidth를 비교해서, 글자가 실제로 넘칠 때에만 넘치는 만큼의 거리를 `--marquee-dist` css 변수에 넣고 애니메이션 클래스를 붙입니다.
- 넘치지 않는 제목에는 아무 처리도 하지 않으므로 불필요한 애니메이션이 생기지 않습니다. 키프레임은 src/app.css의 `marquee-scroll`입니다.
- 화면 폭이 좁은 모바일에서 긴 제목이 잘려 보이는 문제를 해결하기 위한 처리입니다.

#### 4. 웹폰트 추가

- 웹 사이트의 예쁜 디자인과 가독성을 위해 기본 폰트가 아닌 웹폰트를 적용하였습니다.
- 빌드시 최상위로 넘어오는 static/SUIT-Variable.woff2 파일을 src/app.css의 `@font-face`에서 불러와 font-family를 SUIT Variable로 선언하고, 이후 body에 해당 폰트를 적용합니다.
- src/app.html에서 이 폰트를 `<link rel="preload">`로 미리 내려받도록 하여, 첫 화면에서 폰트가 뒤늦게 바뀌어 보이는 현상을 줄였습니다.
