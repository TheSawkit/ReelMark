interface SplashDevice {
	file: string;
	width: number;
	height: number;
	ratio: number;
}

const DEVICES: SplashDevice[] = [
	{
		file: '4__iPhone_SE__iPod_touch_5th_generation_and_later',
		width: 320,
		height: 568,
		ratio: 2,
	},
	{
		file: 'iPhone_8__iPhone_7__iPhone_6s__iPhone_6__4.7__iPhone_SE',
		width: 375,
		height: 667,
		ratio: 2,
	},
	{
		file: 'iPhone_8_Plus__iPhone_7_Plus__iPhone_6s_Plus__iPhone_6_Plus',
		width: 414,
		height: 736,
		ratio: 3,
	},
	{ file: 'iPhone_11__iPhone_XR', width: 414, height: 896, ratio: 2 },
	{
		file: 'iPhone_13_mini__iPhone_12_mini__iPhone_11_Pro__iPhone_XS__iPhone_X',
		width: 375,
		height: 812,
		ratio: 3,
	},
	{
		file: 'iPhone_17e__iPhone_16e__iPhone_14__iPhone_13_Pro__iPhone_13__iPhone_12_Pro__iPhone_12',
		width: 390,
		height: 844,
		ratio: 3,
	},
	{
		file: 'iPhone_16__iPhone_15_Pro__iPhone_15__iPhone_14_Pro',
		width: 393,
		height: 852,
		ratio: 3,
	},
	{
		file: 'iPhone_17_Pro__iPhone_17__iPhone_16_Pro',
		width: 402,
		height: 874,
		ratio: 3,
	},
	{
		file: 'iPhone_11_Pro_Max__iPhone_XS_Max',
		width: 414,
		height: 896,
		ratio: 3,
	},
	{ file: 'iPhone_Air', width: 420, height: 912, ratio: 3 },
	{
		file: 'iPhone_14_Plus__iPhone_13_Pro_Max__iPhone_12_Pro_Max',
		width: 428,
		height: 926,
		ratio: 3,
	},
	{
		file: 'iPhone_16_Plus__iPhone_15_Pro_Max__iPhone_15_Plus__iPhone_14_Pro_Max',
		width: 430,
		height: 932,
		ratio: 3,
	},
	{
		file: 'iPhone_17_Pro_Max__iPhone_16_Pro_Max',
		width: 440,
		height: 956,
		ratio: 3,
	},
	{ file: '8.3__iPad_Mini', width: 744, height: 1133, ratio: 2 },
	{
		file: '9.7__iPad_Pro__7.9__iPad_mini__9.7__iPad_Air__9.7__iPad',
		width: 768,
		height: 1024,
		ratio: 2,
	},
	{ file: '10.2__iPad', width: 810, height: 1080, ratio: 2 },
	{ file: '10.5__iPad_Air', width: 834, height: 1112, ratio: 2 },
	{ file: '10.9__iPad_Air', width: 820, height: 1180, ratio: 2 },
	{
		file: '11__iPad_Pro__10.5__iPad_Pro',
		width: 834,
		height: 1194,
		ratio: 2,
	},
	{ file: '11__iPad_Pro_M4', width: 834, height: 1210, ratio: 2 },
	{ file: '12.9__iPad_Pro', width: 1024, height: 1366, ratio: 2 },
	{ file: '13__iPad_Pro_M4', width: 1032, height: 1376, ratio: 2 },
];

/**
 * Apple launch images for `appleWebApp.startupImage`. iOS only paints one when a media query
 * matches the device exactly, so every size needs its own portrait and landscape entry.
 */
export const APPLE_SPLASH_SCREENS = DEVICES.flatMap(
	({ file, width, height, ratio }) =>
		(['portrait', 'landscape'] as const).map((orientation) => ({
			url: `/splash/${file}_${orientation}.png`,
			media: `(device-width: ${width}px) and (device-height: ${height}px) and (-webkit-device-pixel-ratio: ${ratio}) and (orientation: ${orientation})`,
		}))
);
