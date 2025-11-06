### 자기 이력 홈페이지 만들기

- Github 링크 : https://github.com/jookettle/jookettle.github.io
- 본 사이트는 한남대학교 컴퓨터공학과 과제의 일환으로 제작되었습니다.
- 링크 : https://jookettle.github.io 또는 https://ai.ai.kr (CNAME이 적용된 커스텀 도메인)

- 깃허브 페이지로 구현되어있으나(정적웹으로 빌드 후 접근 가능하게 되는 매커니즘) 자체 소유 도메인 활용하여 https://ai.ai.kr 로 리다이렉트됩니다.
- CSS의 Transition과 hover 이벤트를 활용하여 부드러운 애니메이션 효과를 적극 활용하였습니다.

- 사용 스택 : NodeJS + TailwindCSS + Typescript + Sveltekit + Github Action Workflow
- 자바스크립트는 동적 타입언어이므로 이로 인한 버그를 예방하기 위해 Typescript라는 기술을 사용하였습니다.
- Svelte는 풀스택 대응 가능한 언어이나, Github Page를 사용하기 위해 정적으로 빌드폴더에 생성되도록 adapter 패키지를 추가적으로 설치하고, .github/workflow/deploy.yml 으로 커밋 즉시 깃허브 페이지로 배포되도록 구축하였습니다.
- code formatting 및 linting을 위해 prettier와 eslint를 사용하였습니다.
- 모바일 환경 최적화를 위해 반응형 웹으로 제작되었습니다.

- 템플릿을 사용하지 않고 처음부터 직접 제작하였습니다.
- 깃허브 액션으로 커밋 후 배포작업을 자동으로 진행하도록 되어있기 때문에 clone 후 index.html이 없기 때문에 사이트에서 접속하는 경우가 아닌 경우 정상적으로 사이트가 작동하지 않습니다.
- 사이트 내 링크된 프로젝트는 지금까지 제가 참여한 독자 제작 프로젝트와 팀 프로젝트가 함께 기입되어있습니다.

#### 1. 언어 변경 기능

- 한국어, 영어, 일본어 언어를 모든 문자열을 변수에 저장하여 setLocale 함수를 실행하면 즉각적으로 변경되게 함.
- src/routes/+page.svelte의 407번 줄부터 431번까지, 351번 줄부터 353번 줄까지, locale 글로벌 변수는 48번줄에서 선언.
- 48번 줄에서 Writable로 변수 상태를 지정하고, 기본값을 ko로 지정했습니다. 그리고 함수를 실행할떄마다 글로벌 변수가 수정되고, KO EN JA 버튼을 누르면 인라인 코드로 실행이 됩니다.

#### 2. 모바일 화면 동적 최적화

- handleResize 함수를 resize 이벤트시마다 실행하도록 하여 css 변수로 자동으로 입력하고, 모바일 환경에서 100vh시 주소창과 네비게이션 바를 포함하는 높이로 계산되기 때문에 이를 보정하기 위해서 innerHeight를 추가로 계산하여 적용시켰습니다.
- src/routes/+page.svelte의 721번줄부터 724번줄, 355번줄부터 380번줄까지 입니다.
- onMount 함수의 파라미터 안의 화살표 함수는 클라이언트에서 화면이 표시되었을떄 브라우저에서 실행되는 함수입니다. handleresize 함수는 화면의 크기가 조절될때마다 호출되며, 함수가 호출되면 도큐먼트 엘리먼트(body)에 vh라는 css 변수가 동적으로 삽입됩니다. css에서도 즉각적으로 변경되어 모바일 환경에서 높이가 보정됩니다.

#### 3. 웹폰트 추가.

- 웹 사이트의 예쁜 디자인과 가독성을 위해 기본 폰트가 아닌 웹폰트를 적용하였습니다.
- 빌드시 최상위로 넘어오는 static/SUIT-Variable.woff2, src/app.css의 1번 줄부터 13번줄.
- app.css의 @font-face는 웹 폰트를 불러와서 font family를 SUIT Variable로 설정한다는 선언이고, 이후 body에 SUIT폰트를 적용한다는 간단한 코드입니다.
