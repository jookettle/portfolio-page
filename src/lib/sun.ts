/*
 * 방문자가 있는 곳의 지금 이 순간 태양 위치를 계산해 화면의 광원으로 옮긴다.
 * DOM을 건드리지 않는 순수 함수만 두어 따로 떼어 검증할 수 있게 했다.
 */

const RAD = Math.PI / 180;
const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), hi);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * 흔한 시간대의 대표 도시 좌표. 위치 권한을 묻지 않고 시간대 이름만으로
 * 대략적인 위치를 잡기 위해서다. 빛의 방향과 색을 정하는 데는 이 정도로 충분하다.
 */
const ZONES: Record<string, [lat: number, lon: number]> = {
	'Asia/Seoul': [37.57, 126.98],
	'Asia/Tokyo': [35.68, 139.69],
	'Asia/Shanghai': [31.23, 121.47],
	'Asia/Singapore': [1.35, 103.82],
	'Europe/London': [51.51, -0.13],
	'Europe/Paris': [48.86, 2.35],
	'Europe/Berlin': [52.52, 13.4],
	'America/New_York': [40.71, -74.0],
	'America/Chicago': [41.88, -87.63],
	'America/Denver': [39.74, -104.99],
	'America/Los_Angeles': [34.05, -118.24],
	'Australia/Sydney': [-33.87, 151.21]
};

/**
 * 모르는 시간대는 그 시간대의 표준 자오선 위, 중위도에 있다고 가정한다.
 * getTimezoneOffset은 UTC보다 앞서면 음수라서(서울은 -540) 부호를 뒤집는다.
 */
export function guessLocation(
	timeZone: string | undefined,
	offsetMinutes: number
): { lat: number; lon: number } {
	const known = timeZone ? ZONES[timeZone] : undefined;
	if (known) return { lat: known[0], lon: known[1] };
	return { lat: 37.5, lon: -offsetMinutes / 4 };
}

/**
 * NOAA의 간이 태양 위치 공식.
 * 고도는 지평선 기준(도), 시간각은 남중(정오) 기준으로 오전이 음수다(도).
 */
export function sunPosition(
	date: Date,
	lat: number,
	lon: number
): { elevation: number; hourAngle: number } {
	const startOfYear = Date.UTC(date.getUTCFullYear(), 0, 0);
	const dayOfYear = Math.floor((date.getTime() - startOfYear) / 86_400_000);
	const hours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
	const g = ((2 * Math.PI) / 365) * (dayOfYear - 1 + (hours - 12) / 24);

	// 균시차(분). 지구 궤도가 타원이고 자전축이 기울어서 해시계가 시계와 어긋나는 양이다.
	const equationOfTime =
		229.18 *
		(0.000075 +
			0.001868 * Math.cos(g) -
			0.032077 * Math.sin(g) -
			0.014615 * Math.cos(2 * g) -
			0.040849 * Math.sin(2 * g));

	// 태양의 적위(라디안).
	const declination =
		0.006918 -
		0.399912 * Math.cos(g) +
		0.070257 * Math.sin(g) -
		0.006758 * Math.cos(2 * g) +
		0.000907 * Math.sin(2 * g) -
		0.002697 * Math.cos(3 * g) +
		0.00148 * Math.sin(3 * g);

	// UTC 기준 진태양시(분). 경도 1도마다 4분씩 차이 난다.
	const trueSolarMinutes = hours * 60 + equationOfTime + 4 * lon;
	let hourAngle = trueSolarMinutes / 4 - 180;
	hourAngle = ((((hourAngle + 180) % 360) + 360) % 360) - 180;

	const latR = lat * RAD;
	const cosZenith =
		Math.sin(latR) * Math.sin(declination) +
		Math.cos(latR) * Math.cos(declination) * Math.cos(hourAngle * RAD);
	const elevation = 90 - Math.acos(clamp(cosZenith, -1, 1)) / RAD;

	return { elevation, hourAngle };
}

export interface SunLight {
	/** 화면 기준 광원 위치(0~1). 아침은 왼쪽, 저녁은 오른쪽, 해가 높을수록 위쪽이다. */
	x: number;
	y: number;
	/** 빛의 색. CSS의 rgb()에 그대로 넣는다. */
	rgb: [number, number, number];
	/** 빛의 세기(0~1). 밤에는 달빛이라 약해진다. */
	intensity: number;
	/** 그림자 길이 배율. 해가 낮을수록 길어진다. */
	shadowLength: number;
}

const NOON: [number, number, number] = [255, 247, 235];
const GOLDEN: [number, number, number] = [255, 176, 104];
const DUSK: [number, number, number] = [196, 170, 255];
const MOON: [number, number, number] = [170, 196, 255];

const mix = (a: number[], b: number[], t: number) =>
	a.map((v, i) => Math.round(lerp(v, b[i], t))) as [number, number, number];

/** 박명이 끝나는 고도(도). 이보다 낮으면 밤으로 친다. */
const NIGHT = -6;
/** 이 고도(도)까지는 노을빛이 섞인다. */
const GOLDEN_HOUR = 20;

/**
 * 태양 위치를 화면의 빛으로 옮긴다.
 *
 * 가로 위치는 방위각이 아니라 시간각으로 정한다. 방위각을 쓰면 남반구에서는
 * 해가 북쪽에 떠서 정오의 해가 화면 가장자리로 가 버린다. 시간각을 쓰면 어디서든
 * 아침은 왼쪽, 한낮은 가운데, 저녁은 오른쪽이라 하루가 왼쪽에서 오른쪽으로 흐른다.
 */
export function sunLight(date: Date, lat: number, lon: number): SunLight {
	const { elevation, hourAngle } = sunPosition(date, lat, lon);

	if (elevation <= NIGHT) {
		// 밤에는 달이 해의 반대편에서 같은 방향으로 하늘을 가로지른다고 친다.
		const moonAngle = hourAngle > 0 ? hourAngle - 180 : hourAngle + 180;
		return {
			x: clamp(0.5 + moonAngle / 190, 0.04, 0.96),
			y: 0.28,
			rgb: MOON,
			intensity: 0.55,
			shadowLength: 1.8
		};
	}

	const x = clamp(0.5 + hourAngle / 190, 0.04, 0.96);
	const y = clamp(0.5 - (Math.max(elevation, 0) / 90) * 0.48, 0.03, 0.55);

	let rgb: [number, number, number];
	let intensity: number;
	if (elevation >= GOLDEN_HOUR) {
		rgb = NOON;
		intensity = 1;
	} else if (elevation >= 0) {
		rgb = mix(GOLDEN, NOON, elevation / GOLDEN_HOUR);
		intensity = 1;
	} else {
		// 해가 막 진 박명. 노을빛이 보랏빛으로 식어 가며 약해진다.
		const t = elevation / NIGHT;
		rgb = mix(GOLDEN, DUSK, t);
		intensity = lerp(1, 0.55, t);
	}

	const low = 1 - clamp(elevation, 0, 90) / 90;
	return { x, y, rgb, intensity, shadowLength: 1 + low * low * 1.6 };
}

/**
 * 주소에 ?sun=18:40 처럼 시각을 주면 그 시각의 빛으로 고정한다.
 * 아침·저녁·밤의 모습을 기다리지 않고 바로 확인하기 위한 장치다.
 */
export function parseSunOverride(search: string): Date | null {
	const value = new URLSearchParams(search).get('sun');
	const match = value?.match(/^(\d{1,2}):(\d{2})$/);
	if (!match) return null;
	const hour = Number(match[1]);
	const minute = Number(match[2]);
	if (hour > 23 || minute > 59) return null;
	const date = new Date();
	date.setHours(hour, minute, 0, 0);
	return date;
}
