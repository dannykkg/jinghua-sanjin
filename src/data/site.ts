export const SITE = {
  width: 26,
  depth: 56,
  wallHeight: 2.6,
  wallThickness: 0.4,
  centerX: 13,
} as const;

export type Facade = 'south' | 'north' | 'east' | 'west';

export interface HallSpec {
  id: string;
  name: string;
  x1: number;
  x2: number;
  z1: number;
  z2: number;
  platform: number;
  eave: number;
  ridge: number;
  bays: number[];
  facade: Facade;
  porch: number;
  doorBay: number;
  roofAxis: 'x' | 'z';
  interior: 'mainHall' | 'southHall' | 'rearHall' | 'westWing' | 'eastWing';
}

export const MAIN_HALL: HallSpec = {
  id: 'mainHall', name: '正房', x1: 4.6, x2: 21.4, z1: 37.4, z2: 44.6,
  platform: 0.60, eave: 4.05, ridge: 6.05,
  bays: [3.1, 3.3, 4.0, 3.3, 3.1], facade: 'south', porch: 1.8, doorBay: 2,
  roofAxis: 'x', interior: 'mainHall',
};

export const SOUTH_HALL: HallSpec = {
  id: 'southHall', name: '倒座房', x1: 1.4, x2: 17.9, z1: 0.4, z2: 5.4,
  platform: 0.20, eave: 3.15, ridge: 4.50,
  bays: [3.3, 3.3, 3.3, 3.3, 3.3], facade: 'north', porch: 0, doorBay: 2,
  roofAxis: 'x', interior: 'southHall',
};

export const REAR_HALL: HallSpec = {
  id: 'rearHall', name: '后罩房', x1: 2.15, x2: 23.85, z1: 51.4, z2: 55.6,
  platform: 0.45, eave: 3.30, ridge: 4.70,
  bays: [3.1, 3.1, 3.1, 3.1, 3.1, 3.1, 3.1], facade: 'south', porch: 0, doorBay: 3,
  roofAxis: 'x', interior: 'rearHall',
};

export const WEST_WING: HallSpec = {
  id: 'westWing', name: '西厢房', x1: 1.0, x2: 6.1, z1: 25.6, z2: 35.2,
  platform: 0.45, eave: 3.55, ridge: 5.00,
  bays: [3.15, 3.3, 3.15], facade: 'east', porch: 1.2, doorBay: 1,
  roofAxis: 'z', interior: 'westWing',
};

export const EAST_WING: HallSpec = {
  id: 'eastWing', name: '东厢房', x1: 19.7, x2: 25.0, z1: 25.6, z2: 35.2,
  platform: 0.45, eave: 3.55, ridge: 5.00,
  bays: [3.15, 3.3, 3.15], facade: 'west', porch: 1.2, doorBay: 1,
  roofAxis: 'z', interior: 'eastWing',
};

export const HALLS = [MAIN_HALL, SOUTH_HALL, REAR_HALL, WEST_WING, EAST_WING];

export const GATE = {
  id: 'gate', name: '宅门', x1: 19.6, x2: 22.8, z1: 0.8, z2: 5.8,
  platform: 0.45, eave: 4.25, ridge: 5.90,
};

export const GATE_HOUSE = {
  id: 'gateHouse', name: '垂花门', x1: 11.4, x2: 14.6, z1: 15.2, z2: 19.2,
  platform: 0.45, eave: 3.55, ridge: 4.90,
};

export const SCREEN_WALL = {
  x1: 19.45, x2: 23.05, z1: 7.0, z2: 7.5, height: 3.1,
};

export const CORRIDORS = [
  { x1: 6.1, z1: 19.2, x2: 7.6, z2: 37.4, side: 'west' as const },
  { x1: 18.2, z1: 19.2, x2: 19.7, z2: 37.4, side: 'east' as const },
  { x1: 7.6, z1: 19.2, x2: 11.4, z2: 20.7, side: 'south-west' as const },
  { x1: 14.6, z1: 19.2, x2: 18.2, z2: 20.7, side: 'south-east' as const },
];

export const TERRACE = { x1: 6.1, x2: 19.7, z1: 35.2, z2: 37.4, height: 0.60 };

export const PATHS = {
  main: { x1: 11.9, x2: 14.1, z1: 19.2, z2: 35.2 },
  cross: { x1: 7.6, x2: 18.4, z1: 29.4, z2: 31.4 },
  front: { x1: 5.0, x2: 21.0, z1: 9.2, z2: 11.2 },
  rear: { x1: 11.6, x2: 14.4, z1: 45.6, z2: 51.4 },
};

export const SIDE_PASSAGES = [
  { x1: 0.4, z1: 37.4, x2: 2.2, z2: 44.6 },
  { x1: 23.8, z1: 37.4, x2: 25.6, z2: 44.6 },
];

export const HOTSPOTS = [
  {
    id: 'outside', name: '门外', kicker: '胡同 · 宅门',
    x: 21.2, y: 1.8, z: -6.0, yaw: Math.PI, pitch: 0.04,
    title: '巽位开门',
    text: '宅门在院落东南角，不在中轴。广亮大门门扉设在中柱，前留门廊；黑红净油饰，不施宫门式门钉。',
    facts: ['门在东南 · 坎宅巽门', '广亮大门 · 门扉中柱', '黑红净 · 青砖灰瓦'],
  },
  {
    id: 'gatePassage', name: '门道', kicker: '一进院 · 宅门',
    x: 21.2, y: 1.72, z: 3.6, yaw: Math.PI, pitch: 0.01,
    title: '进门见壁',
    text: '穿过 5 米深的门道，迎面是一字影壁。视线被挡住，人自然向西折入前院——这是四合院“挡—折—放”的第一折。',
    facts: ['门道进深 5.0 m', '一字影壁 · 方砖斜墁', '影壁用小号筒瓦'],
  },
  {
    id: 'frontCourt', name: '一进院', kicker: '外院 · 对外',
    x: 10.4, y: 1.72, z: 13.0, yaw: 0, pitch: 0.015,
    title: '外院与外客',
    text: '倒座房一排，门房、账房、客房都在外院。男仆住这里，不进内宅。北面是垂花门与看面墙，内外在此分野。',
    facts: ['倒座房五间', '后檐临街开高窗', '男仆居外院 · 不入内宅'],
  },
  {
    id: 'gateHouseFront', name: '垂花门', kicker: '二门 · 内外之间',
    x: 13.0, y: 1.72, z: 10.5, yaw: Math.PI, pitch: 0.08,
    title: '二门垂花',
    text: '垂花门是中轴上的二门。前檐梁头下吊悬空短柱，柱头雕花；四扇屏门平时闭合，左右接抄手游廊。',
    facts: ['开间 3.2 m · 进深 4.0 m', '一殿一卷 · 垂莲柱', '前檐三步在檐下 · 后檐延长平台接踏步', '游廊卷棚与门屋搭接'],
  },
  {
    id: 'innerCourt', name: '内院', kicker: '二进院 · 家宅',
    x: 13.0, y: 1.72, z: 23.4, yaw: Math.PI, pitch: 0.01,
    title: '庭院深深',
    text: '垂花门以内豁然开朗。正房五间高居北端，东西厢房各三间，抄手游廊环抱；十字甬路把院子分成四块，海棠、石榴、鱼缸各得其所。',
    facts: ['正房五间 · 厢房三间', '抄手游廊 · 卷棚顶', '游廊端部留口 · 可入廊后小院', '海棠 / 石榴 / 鱼缸'],
  },
  {
    id: 'terrace', name: '月台', kicker: '正房 · 台基',
    x: 13.0, y: 1.72, z: 33.4, yaw: Math.PI, pitch: 0.05,
    title: '台基与等级',
    text: '正房台基 0.60 m，四步踏跺，高于厢房。月台前伸，是家族行礼、摆供、看戏的过渡空间；抬头可见七檩前廊与清水脊。',
    facts: ['台基 0.60 m · 四步', '月台 13.6 × 2.2 m · 前廊 1.8 m', '月台东西端四级侧阶下夹道'],
  },
  {
    id: 'mainHall', name: '正房明间', kicker: '中堂 · 礼仪',
    x: 13.0, y: 2.25, z: 40.2, yaw: Math.PI, pitch: -0.01,
    title: '中堂对称',
    text: '条案靠后檐墙，八仙桌居中，太师椅成对；中堂画与对联左右相称。这里是会客、议事、祭祀的核心，也是全院最讲究的一间。',
    facts: ['条案—八仙桌—太师椅', '中堂画 + 对联', '前廊 1.8 m · 彻上明造'],
  },
  {
    id: 'eastStudy', name: '东厢书房', kicker: '东厢 · 长子',
    x: 21.4, y: 2.07, z: 26.8, yaw: -Math.PI * 0.75, pitch: -0.01,
    title: '东厢读书',
    text: '长子住东厢。画案靠窗，多宝阁靠墙，圈椅、书架、棋盘各安其位；窗外正对抄手游廊与内院花木。',
    facts: ['东厢略深于西厢', '六檩前廊', '书房 · 茶室'],
  },
  {
    id: 'westBedroom', name: '西厢卧房', kicker: '西厢 · 次子',
    x: 4.4, y: 2.07, z: 26.8, yaw: Math.PI * 0.75, pitch: -0.01,
    title: '西厢起居',
    text: '次子住西厢。卧房陈设比正房简净：榻、衣箱、书桌、盆架；窗外是内院西侧的游廊与树影。',
    facts: ['西厢三间', '六檩前廊', '卧房 · 起居'],
  },
  {
    id: 'rearCourt', name: '后院', kicker: '三进院 · 私密',
    x: 13.0, y: 1.72, z: 45.3, yaw: Math.PI, pitch: 0.015,
    title: '后罩深静',
    text: '正房之后是三进院。后罩房一排七间，后墙临胡同而封闭；未嫁女眷、女仆、藏书与储藏都在这里，是全院最安静的一进。',
    facts: ['后罩房七间', '后墙不开大门', '枣树 · 石桌 · 水缸'],
  },
  {
    id: 'birdview', name: '鸟瞰', kicker: '格局 · 三进',
    x: 13.0, y: 31.0, z: 62.0, yaw: Math.PI, pitch: -0.55,
    title: '三进格局',
    text: '从高处看，一进院窄、二进院大、三进院静；宅门偏东南，垂花门与正房压在中轴。等级不是装饰，是平面和高度一起写出来的。',
    facts: ['一进 9.4 m · 二进 18.2 m · 三进 6.8 m', '宅门偏东 · 中轴居中', '正房最高 · 厢房次之'],
  },
] as const;

export const WALK_START = { x: 13.0, z: 23.2, yaw: Math.PI, pitch: 0 };

export const ORBIT_START = { x: 13, y: 34, z: 64, targetX: 13, targetY: 0, targetZ: 27 };

export const ROOM_LABELS: { text: string; x: number; y: number; z: number; kind?: 'major' | 'minor' }[] = [
  { text: '一进院', x: 9.5, y: 0.2, z: 10.7, kind: 'minor' },
  { text: '倒座房', x: 9.6, y: 2.2, z: 3.2, kind: 'minor' },
  { text: '垂花门', x: 13, y: 2.8, z: 17.2, kind: 'major' },
  { text: '二进院', x: 13, y: 0.2, z: 23.2, kind: 'minor' },
  { text: '正房', x: 13, y: 4.6, z: 41.0, kind: 'major' },
  { text: '月台', x: 13, y: 0.8, z: 36.3, kind: 'minor' },
  { text: '侧夹道', x: 1.3, y: 0.25, z: 40.8, kind: 'minor' },
  { text: '侧夹道', x: 24.7, y: 0.25, z: 40.8, kind: 'minor' },
  { text: '西厢房', x: 3.5, y: 3.2, z: 30.4, kind: 'minor' },
  { text: '东厢房', x: 22.3, y: 3.2, z: 30.4, kind: 'minor' },
  { text: '廊后小院', x: 3.4, y: 0.25, z: 22.2, kind: 'minor' },
  { text: '廊后小院', x: 22.6, y: 0.25, z: 22.2, kind: 'minor' },
  { text: '后院', x: 13, y: 0.2, z: 47.8, kind: 'minor' },
  { text: '后罩房', x: 13, y: 2.4, z: 53.4, kind: 'minor' },
];
