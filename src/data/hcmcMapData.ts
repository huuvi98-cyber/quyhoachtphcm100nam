import type { Feature, FeatureCollection, LineString, Point, Polygon } from 'geojson';
import {
  CON_DAO_RING_UV,
  HCMC_MAINLAND_RING_UV,
  HCMC_PINK_BORDER_UV,
} from './hcmcPinkBoundary';

export interface HubLandmark {
  id: string;
  name: string;
  shortName: string;
  zone: string;
  category: 'core' | 'industry' | 'port' | 'coastal' | 'island' | 'gateway';
  coords: [number, number]; // [lng, lat]
  appearAt: number; // 0..1 normalized timeline progress
  summary: string;
  highlights: string[];
  accentColor: string;
}

export interface GrowthPole {
  id: string;
  title: string;
  description: string;
  coords: [number, number]; // [lng, lat]
  accentColor: string;
  labelSide: 'left' | 'right' | 'top' | 'bottom';
}

export interface TransportRoute {
  id: string;
  name: string;
  subtitle: string;
  color: string;
  glowColor: string;
  startAt: number; // 0..1 normalized timeline progress
  endAt: number;
  isMaritime?: boolean;
  coords: Array<[number, number]>;
}

export interface BorderDirectionInfo {
  id: string;
  direction: string;
  label: string;
  detail: string;
  coords: [number, number];
  appearAt: number;
  arcCoords: Array<[number, number]>;
}

export interface TimelineChapter {
  id: string;
  label: string;
  shortLabel: string;
  start: number; // 0..1
  end: number;
  description: string;
}

export interface CameraKeyframe {
  t: number; // 0..1
  center: [number, number];
  zoom: number;
  pitch: number;
  bearing: number;
}

// ---------------------------------------------------------------------------
// 0. EXACT ZERO-DISTORTION WEB MERCATOR PROJECTION FOR 5-POLE MASTERPLAN MAP
//    Image: /assets/ban_do_5_cuc.png (3445 x 2953 px)
//    Maps normalized image coordinates (u, v) in [0..1] x [0..1] pixel-accurately
//    onto MapLibre GL's Web Mercator image source with zero aspect-ratio stretch.
// ---------------------------------------------------------------------------

export const OFFICIAL_MAP_IMAGE_URL = '/assets/ban_do_5_cuc_clean.png';
export const FOLDED_MAP_IMAGE_URL = '/assets/aistudio/Ban_do-_HCM-1_690dc276.png';

export const MAP_CAPTION_TEXT =
  '5 cực động lực trong dự thảo Quy hoạch tổng thể TPHCM giai đoạn 2025-2050, tầm nhìn 100 năm';

const IMG_WIDTH = 3445;
const IMG_HEIGHT = 2953;
const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

const MAP_WEST = 105.9;
const MAP_EAST = 107.9;
const MAP_NORTH = 11.72;

function latToMercY(latDeg: number): number {
  return Math.log(Math.tan(Math.PI / 4 + (latDeg * DEG2RAD) / 2));
}

function mercYToLat(mercY: number): number {
  return (2 * Math.atan(Math.exp(mercY)) - Math.PI / 2) * RAD2DEG;
}

const MERC_Y_NORTH = latToMercY(MAP_NORTH);
const MERC_SPAN_X = (MAP_EAST - MAP_WEST) * DEG2RAD;
const MERC_SPAN_Y = MERC_SPAN_X * (IMG_HEIGHT / IMG_WIDTH);
const MERC_Y_SOUTH = MERC_Y_NORTH - MERC_SPAN_Y;
const MAP_SOUTH = mercYToLat(MERC_Y_SOUTH);

/** Exact 4 corners [topLeft, topRight, bottomRight, bottomLeft] for MapLibre `type: 'image'` source */
export const MAP_IMAGE_COORDINATES: [
  [number, number],
  [number, number],
  [number, number],
  [number, number],
] = [
  [MAP_WEST, MAP_NORTH],
  [MAP_EAST, MAP_NORTH],
  [MAP_EAST, MAP_SOUTH],
  [MAP_WEST, MAP_SOUTH],
];

/** Generous pan bounds around the 5-pole masterplan map canvas */
export const MAP_MAX_BOUNDS: [[number, number], [number, number]] = [
  [MAP_WEST - 0.85, MAP_SOUTH - 0.65],
  [MAP_EAST + 0.85, MAP_NORTH + 0.65],
];

/** Converts normalized image coordinates (u left->right, v top->bottom) to exact [lng, lat] */
export function uvToLngLat(u: number, v: number): [number, number] {
  const lng = MAP_WEST + u * (MAP_EAST - MAP_WEST);
  const mercY = MERC_Y_NORTH - v * MERC_SPAN_Y;
  return [lng, mercYToLat(mercY)];
}

function uvRing(points: Array<[number, number]>): Array<[number, number]> {
  return points.map(([u, v]) => uvToLngLat(u, v));
}

// ---------------------------------------------------------------------------
// 1. EXPANDED TP.HCM MEGACITY GEOJSON ALIGNED PIXEL-FOR-PIXEL TO 5-POLE MAP
// ---------------------------------------------------------------------------

/** Exact 295-point polyline hugging the red-dashed outer border of TP.HCM */
export const HCMC_PINK_BORDER_LINE: Array<[number, number]> = uvRing(HCMC_PINK_BORDER_UV);

/** Exact 295-point closed silhouette of expanded TP.HCM mainland */
export const HCMC_MAINLAND_RING: Array<[number, number]> = uvRing(HCMC_MAINLAND_RING_UV);

/** Exact 56-point closed silhouette of Đặc khu Côn Đảo main island */
export const CON_DAO_RING: Array<[number, number]> = uvRing(CON_DAO_RING_UV);

export const HCMC_BOUNDARY_GEOJSON: FeatureCollection<Polygon> = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: 'hcmc-mainland',
        name: 'Siêu đô thị TP.HCM (2025–2050)',
        area: 'Đất liền & vùng ven biển',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [HCMC_MAINLAND_RING],
      },
    },
    {
      type: 'Feature',
      properties: {
        id: 'hcmc-condao',
        name: 'Đặc khu Côn Đảo',
        area: 'Hải đảo Biển Đông',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [CON_DAO_RING],
      },
    },
  ],
};

// 4 strategic planning sub-zones aligned cleanly to the 5-pole map
export const HCMC_SUBZONES_GEOJSON: FeatureCollection<Polygon> = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: 'zone-north',
        name: 'Cực công nghiệp – logistics phía Bắc',
        shortName: 'Cực Bắc (Bến Cát – Bàu Bàng – Tân Uyên)',
        fillColor: '#E11D48',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          uvRing([
            [0.21, 0.19],
            [0.26, 0.12],
            [0.33, 0.13],
            [0.36, 0.21],
            [0.44, 0.13],
            [0.48, 0.21],
            [0.53, 0.22],
            [0.54, 0.37],
            [0.49, 0.43],
            [0.44, 0.45],
            [0.32, 0.45],
            [0.24, 0.40],
            [0.25, 0.32],
            [0.20, 0.24],
            [0.21, 0.19],
          ]),
        ],
      },
    },
    {
      type: 'Feature',
      properties: {
        id: 'zone-core',
        name: 'Cực lõi trung tâm & Đổi mới sáng tạo phía Đông',
        shortName: 'Lõi Trung tâm – Thủ Đức – Cực Tây',
        fillColor: '#F59E0B',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          uvRing([
            [0.24, 0.40],
            [0.32, 0.45],
            [0.45, 0.45],
            [0.49, 0.55],
            [0.44, 0.62],
            [0.42, 0.66],
            [0.31, 0.64],
            [0.28, 0.57],
            [0.29, 0.50],
            [0.22, 0.46],
            [0.24, 0.40],
          ]),
        ],
      },
    },
    {
      type: 'Feature',
      properties: {
        id: 'zone-coastal',
        name: 'Cực cảng biển – thương mại tự do – năng lượng phía Nam',
        shortName: 'Hành lang Biển (Cần Giờ – Phú Mỹ – Vũng Tàu – Hồ Tràm)',
        fillColor: '#059669',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          uvRing([
            [0.42, 0.66],
            [0.49, 0.66],
            [0.55, 0.68],
            [0.60, 0.64],
            [0.66, 0.58],
            [0.73, 0.63],
            [0.79, 0.55],
            [0.85, 0.64],
            [0.86, 0.71],
            [0.79, 0.77],
            [0.72, 0.78],
            [0.69, 0.83],
            [0.61, 0.84],
            [0.56, 0.76],
            [0.50, 0.82],
            [0.43, 0.76],
            [0.42, 0.66],
          ]),
        ],
      },
    },
    {
      type: 'Feature',
      properties: {
        id: 'zone-condao',
        name: 'Đặc khu Côn Đảo',
        shortName: 'Đặc khu Côn Đảo',
        fillColor: '#0369A1',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [CON_DAO_RING],
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// 2. 4 COMPASS BORDERS (EXACT USER SPECIFICATION)
//    Placed in clean open margins with zero overlap on printed map elements
// ---------------------------------------------------------------------------

export const BORDER_DIRECTIONS: BorderDirectionInfo[] = [
  {
    id: 'border-north',
    direction: 'PHÍA BẮC',
    label: 'Phía Bắc giáp tỉnh Tây Ninh và TP Đồng Nai',
    detail:
      'Kết nối trục công nghiệp – logistics phía Bắc qua Bến Cát, Bàu Bàng và vùng phụ cận giáp tỉnh Tây Ninh và TP Đồng Nai.',
    coords: uvToLngLat(0.36, 0.068),
    appearAt: 0.16,
    arcCoords: [],
  },
  {
    id: 'border-east',
    direction: 'PHÍA ĐÔNG',
    label: 'Phía Đông giáp TP Đồng Nai và tỉnh Lâm Đồng',
    detail:
      'Liên kết trực tiếp cực đổi mới sáng tạo phía Đông – Đông Bắc với sân bay quốc tế Long Thành, TP Đồng Nai và tỉnh Lâm Đồng.',
    coords: uvToLngLat(0.84, 0.44),
    appearAt: 0.2,
    arcCoords: [],
  },
  {
    id: 'border-west',
    direction: 'PHÍA TÂY',
    label: 'Phía Tây giáp tỉnh Tây Ninh và tỉnh Đồng Tháp',
    detail:
      'Cửa ngõ kết nối cực đô thị – giáo dục – y tế phía Tây với tỉnh Tây Ninh và vùng Đồng bằng sông Cửu Long (tỉnh Đồng Tháp).',
    coords: uvToLngLat(0.118, 0.705),
    appearAt: 0.24,
    arcCoords: [],
  },
  {
    id: 'border-south',
    direction: 'PHÍA NAM',
    label: 'Phía Nam giáp tỉnh Đồng Tháp và Biển Đông (gồm Đặc khu Côn Đảo)',
    detail:
      'Mặt tiền hướng biển rộng mở từ Cần Giờ đến Phú Mỹ – Vũng Tàu – Long Sơn – Châu Đức, vươn ra Biển Đông và Đặc khu Côn Đảo.',
    coords: uvToLngLat(0.57, 0.935),
    appearAt: 0.28,
    arcCoords: [],
  },
];

// ---------------------------------------------------------------------------
// 3. STRATEGIC TRANSPORT ROUTES CONNECTING THE 5 GROWTH POLES & CÔN ĐẢO
// ---------------------------------------------------------------------------

export const TRANSPORT_ROUTES: TransportRoute[] = [
  {
    id: 'route-north-core',
    name: 'Trục động lực Bắc – Trung tâm (Cực Bắc – Lõi Sài Gòn)',
    subtitle: 'Kết nối Bàu Bàng – Bến Cát – Thủ Dầu Một về Cực lõi trung tâm Sài Gòn – Thủ Thiêm',
    color: '#E11D48',
    glowColor: '#FB7185',
    startAt: 0.34,
    endAt: 0.5,
    coords: uvRing([
      [0.3678, 0.3281],
      [0.364, 0.405],
      [0.358, 0.472],
      [0.3861, 0.5784],
    ]),
  },
  {
    id: 'route-west-core-east',
    name: 'Trục Đông – Tây (Cực Tây – Lõi Trung tâm – Cực Đông – Sân bay Long Thành)',
    subtitle: 'Liên kết Cực đô thị, y tế phía Tây qua Lõi trung tâm và Cực đổi mới sáng tạo đến Long Thành',
    color: '#0284C7',
    glowColor: '#38BDF8',
    startAt: 0.42,
    endAt: 0.6,
    coords: uvRing([
      [0.2467, 0.5682],
      [0.315, 0.573],
      [0.3861, 0.5784],
      [0.432, 0.544],
      [0.474, 0.5151],
      [0.532, 0.545],
      [0.58, 0.574],
    ]),
  },
  {
    id: 'route-north-east',
    name: 'Hành lang Đổi mới sáng tạo & Công nghiệp Đông Bắc',
    subtitle: 'Kết nối Bến Cát – Tân Uyên – Dĩ An – Thủ Đức – Sân bay Long Thành',
    color: '#7C3AED',
    glowColor: '#A78BFA',
    startAt: 0.48,
    endAt: 0.64,
    coords: uvRing([
      [0.3678, 0.3281],
      [0.435, 0.374],
      [0.468, 0.44],
      [0.474, 0.5151],
    ]),
  },
  {
    id: 'route-core-south',
    name: 'Trục hướng biển (Lõi Trung tâm – Cần Giờ – Phú Mỹ – Vũng Tàu)',
    subtitle: 'Liên kết trung tâm tài chính quốc tế với Cực cảng biển, thương mại tự do và năng lượng phía Nam',
    color: '#D97706',
    glowColor: '#FBBF24',
    startAt: 0.56,
    endAt: 0.74,
    coords: uvRing([
      [0.3861, 0.5784],
      [0.432, 0.648],
      [0.478, 0.718],
      [0.525, 0.775],
      [0.565, 0.8139],
      [0.642, 0.774],
      [0.728, 0.732],
      [0.802, 0.688],
    ]),
  },
  {
    id: 'route-east-south',
    name: 'Cao tốc kết nối Sân bay Long Thành – Cảng biển phía Nam',
    subtitle: 'Trục logistics hàng không – cảng nước sâu Phú Mỹ – Long Sơn – Vũng Tàu',
    color: '#059669',
    glowColor: '#34D399',
    startAt: 0.62,
    endAt: 0.78,
    coords: uvRing([
      [0.58, 0.574],
      [0.578, 0.655],
      [0.572, 0.735],
      [0.565, 0.8139],
    ]),
  },
  {
    id: 'route-condao-sea',
    name: 'Tuyến hàng hải & hàng không Cực phía Nam – Đặc khu Côn Đảo',
    subtitle: 'Mở rộng không gian kinh tế biển vươn ra Biển Đông và Đặc khu Côn Đảo',
    color: '#0369A1',
    glowColor: '#38BDF8',
    startAt: 0.75,
    endAt: 0.92,
    isMaritime: true,
    coords: uvRing([
      [0.565, 0.8139],
      [0.648, 0.855],
      [0.758, 0.852],
      [0.878, 0.828],
    ]),
  },
];

// ---------------------------------------------------------------------------
// 4. KEY CLICKABLE GLOWING DOTS (TRUNG TÂM TPHCM & ĐẶC KHU CÔN ĐẢO)
// ---------------------------------------------------------------------------

export const HUB_LANDMARKS: HubLandmark[] = [
  {
    id: 'hub-saigon',
    name: 'Trung tâm TPHCM',
    shortName: 'Trung tâm TPHCM',
    zone: 'Lõi đô thị trung tâm',
    category: 'core',
    coords: uvToLngLat(0.345, 0.502),
    appearAt: 0.12,
    summary:
      'Trung tâm tài chính quốc tế, hành chính, thương mại và di sản kiến trúc lõi của siêu đô thị TPHCM.',
    highlights: [
      'Trung tâm Tài chính Quốc tế TPHCM (IFC)',
      'Đầu mối mạng lưới Metro đa tuyến và giao thông xanh',
      'Trục cảnh quan sông Sài Gòn – đại lộ Lê Lợi – Nguyễn Huệ',
    ],
    accentColor: '#E11D48',
  },
  {
    id: 'hub-condao',
    name: 'Đặc khu Côn Đảo',
    shortName: 'Đặc khu Côn Đảo',
    zone: 'Hải đảo Biển Đông',
    category: 'island',
    coords: uvToLngLat(0.878, 0.828),
    appearAt: 0.18,
    summary:
      'Đặc khu sinh thái biển đảo chất lượng cao, bảo tồn thiên nhiên – di sản lịch sử đặc biệt và điểm tựa phát triển kinh tế biển trên Biển Đông.',
    highlights: [
      'Mô hình đặc khu du lịch sinh thái biển đẳng cấp quốc tế',
      'Nâng cấp sân bay Côn Đảo và tuyến tàu cao tốc từ Vũng Tàu – Sài Gòn',
      'Vị trí chiến lược trên tuyến hàng hải quốc tế Biển Đông',
    ],
    accentColor: '#0284C7',
  },
];

// ---------------------------------------------------------------------------
// 4B. 5 STRATEGIC GROWTH POLES (HOVER LOCATION PIN / CIRCLE -> SHOW EXACT TEXT)
//     Aligned directly onto the 5 circular pole icons of /assets/ban_do_5_cuc.png
// ---------------------------------------------------------------------------

export const GROWTH_POLES: GrowthPole[] = [
  {
    id: 'pole-core',
    title: 'Cực lõi trung tâm',
    description:
      'Tập trung tại Sài Gòn - Chợ Lớn - Thủ Thiêm, là trung tâm tài chính quốc tế, quản trị, thương mại, dịch vụ, du lịch, văn hóa, công viên chuyên đề tầm cỡ quốc tế và kinh tế sáng tạo; ưu tiên tái thiết, bảo tồn di sản.',
    coords: uvToLngLat(0.3861, 0.5784),
    accentColor: '#EA580C',
    labelSide: 'bottom',
  },
  {
    id: 'pole-east-northeast',
    title: 'Cực đổi mới sáng tạo phía Đông, Đông Bắc',
    description:
      'Kết nối Thủ Đức, Dĩ An, Thuận An, Bình Dương, Tân Uyên với sân bay Long Thành, tập trung công nghệ cao, AI, bán dẫn và giáo dục đại học.',
    coords: uvToLngLat(0.474, 0.5151),
    accentColor: '#0284C7',
    labelSide: 'right',
  },
  {
    id: 'pole-north',
    title: 'Cực công nghiệp - logistics phía Bắc',
    description:
      'Phát triển tại Bến Cát, Bàu Bàng và vùng phụ cận, chuyển các KCN đơn chức năng thành hệ sinh thái công nghiệp, logistics, đô thị và dịch vụ.',
    coords: uvToLngLat(0.3678, 0.3281),
    accentColor: '#E11D48',
    labelSide: 'right',
  },
  {
    id: 'pole-south',
    title: 'Cực cảng biển - thương mại tự do - công nghiệp năng lượng phía Nam',
    description:
      'Kết nối Châu Đức, Long Sơn, Phú Mỹ, Vũng Tàu và Cần Giờ, phát huy thế mạnh cảng biển, logistics, hàng hải, thương mại tự do và năng lượng.',
    coords: uvToLngLat(0.565, 0.8139),
    accentColor: '#D97706',
    labelSide: 'top',
  },
  {
    id: 'pole-west',
    title: 'Cực đô thị, giáo dục, y tế phía Tây',
    description:
      'Phát triển các khu đô thị đồng bộ, trung tâm đào tạo và y tế chuyên sâu, triển lãm và dịch vụ, giảm áp lực cho khu vực lõi.',
    coords: uvToLngLat(0.2467, 0.5682),
    accentColor: '#2563EB',
    labelSide: 'left',
  },
];

// ---------------------------------------------------------------------------
// 5. TIMELINE STORY CHAPTERS & 3D CAMERA FLY-THROUGH CHOREOGRAPHY
//    Cinematic 3D perspective (pitch 36°–56°, dynamic bearing orbit & zoom)
// ---------------------------------------------------------------------------

export const TIMELINE_DURATION_SEC = 34;

export const TIMELINE_CHAPTERS: TimelineChapter[] = [
  {
    id: 'ch-overview',
    label: 'Toàn cảnh 5 cực động lực',
    shortLabel: '1. Toàn cảnh',
    start: 0.0,
    end: 0.1,
    description:
      'Toàn cảnh bản đồ 5 cực động lực trong dự thảo Quy hoạch tổng thể TPHCM giai đoạn 2025-2050, tầm nhìn 100 năm.',
  },
  {
    id: 'ch-north',
    label: 'Cực công nghiệp - logistics phía Bắc',
    shortLabel: '2. Cực Bắc',
    start: 0.1,
    end: 0.28,
    description:
      'Phát triển tại Bến Cát, Bàu Bàng và vùng phụ cận thành hệ sinh thái công nghiệp, logistics, đô thị và dịch vụ.',
  },
  {
    id: 'ch-east',
    label: 'Cực đổi mới sáng tạo phía Đông, Đông Bắc',
    shortLabel: '3. Cực Đông',
    start: 0.28,
    end: 0.45,
    description:
      'Kết nối Thủ Đức, Dĩ An, Thuận An, Bình Dương, Tân Uyên với sân bay Long Thành, tập trung công nghệ cao, AI và bán dẫn.',
  },
  {
    id: 'ch-core',
    label: 'Cực lõi trung tâm',
    shortLabel: '4. Lõi Trung tâm',
    start: 0.45,
    end: 0.62,
    description:
      'Tập trung tại Sài Gòn - Chợ Lớn - Thủ Thiêm, trung tâm tài chính quốc tế, thương mại, văn hóa và kinh tế sáng tạo.',
  },
  {
    id: 'ch-west',
    label: 'Cực đô thị, giáo dục, y tế phía Tây',
    shortLabel: '5. Cực Tây',
    start: 0.62,
    end: 0.78,
    description:
      'Phát triển các khu đô thị đồng bộ, trung tâm đào tạo và y tế chuyên sâu, triển lãm và dịch vụ.',
  },
  {
    id: 'ch-south',
    label: 'Cực cảng biển - năng lượng phía Nam',
    shortLabel: '6. Cực Nam',
    start: 0.78,
    end: 1.0,
    description:
      'Kết nối Châu Đức, Long Sơn, Phú Mỹ, Vũng Tàu và Cần Giờ, phát huy thế mạnh cảng biển, thương mại tự do và năng lượng.',
  },
];

export const OVERVIEW_3D_CAMERA = {
  center: uvToLngLat(0.48, 0.53),
  zoom: 8.2,
  pitch: 38,
  bearing: -10,
};

export const POLE_CAMERA_TARGETS: Record<
  string,
  { center: [number, number]; zoom: number; pitch: number; bearing: number }
> = {
  'pole-north': { center: uvToLngLat(0.39, 0.34), zoom: 9.75, pitch: 52, bearing: 14 },
  'pole-east-northeast': { center: uvToLngLat(0.49, 0.51), zoom: 9.9, pitch: 54, bearing: -16 },
  'pole-core': { center: uvToLngLat(0.39, 0.58), zoom: 10.15, pitch: 56, bearing: 16 },
  'pole-west': { center: uvToLngLat(0.26, 0.57), zoom: 9.75, pitch: 50, bearing: -15 },
  'pole-south': { center: uvToLngLat(0.56, 0.79), zoom: 9.6, pitch: 52, bearing: 18 },
};

export const CAMERA_KEYFRAMES: CameraKeyframe[] = [
  // 3D aerial opening overview of all 5 growth poles (matches t = 1.0 for seamless looping)
  { t: 0.0, center: uvToLngLat(0.48, 0.53), zoom: 8.2, pitch: 38, bearing: -10 },
  { t: 0.06, center: uvToLngLat(0.48, 0.53), zoom: 8.32, pitch: 42, bearing: -6 },
  // 1. 3D swoop & zoom onto Cực công nghiệp - logistics phía Bắc
  { t: 0.15, center: uvToLngLat(0.39, 0.34), zoom: 9.65, pitch: 52, bearing: 10 },
  { t: 0.24, center: uvToLngLat(0.4, 0.35), zoom: 9.8, pitch: 54, bearing: 18 },
  // 2. 3D bank & zoom onto Cực đổi mới sáng tạo phía Đông, Đông Bắc
  { t: 0.33, center: uvToLngLat(0.49, 0.51), zoom: 9.8, pitch: 54, bearing: -12 },
  { t: 0.41, center: uvToLngLat(0.495, 0.515), zoom: 9.95, pitch: 56, bearing: -19 },
  // 3. Hero 3D dive & orbit over Cực lõi trung tâm (Sài Gòn - Thủ Thiêm)
  { t: 0.5, center: uvToLngLat(0.39, 0.58), zoom: 10.05, pitch: 56, bearing: 8 },
  { t: 0.58, center: uvToLngLat(0.388, 0.578), zoom: 10.22, pitch: 58, bearing: 20 },
  // 4. 3D sweep & zoom onto Cực đô thị, giáo dục, y tế phía Tây
  { t: 0.67, center: uvToLngLat(0.26, 0.57), zoom: 9.68, pitch: 50, bearing: -10 },
  { t: 0.74, center: uvToLngLat(0.255, 0.568), zoom: 9.82, pitch: 52, bearing: -18 },
  // 5. 3D coastal swoop onto Cực cảng biển - thương mại tự do - năng lượng phía Nam
  { t: 0.83, center: uvToLngLat(0.56, 0.79), zoom: 9.52, pitch: 52, bearing: 12 },
  { t: 0.91, center: uvToLngLat(0.57, 0.785), zoom: 9.68, pitch: 54, bearing: 22 },
  // Smooth aerial climb back to 3D overview
  { t: 1.0, center: uvToLngLat(0.48, 0.53), zoom: 8.2, pitch: 38, bearing: -10 },
];

/** Builds concentric 3D extruded cylindrical ring polygons around the 5 growth poles */
export function buildPole3DRingsGeoJSON(): FeatureCollection<Polygon> {
  const poleUvCenters: Array<{ id: string; u: number; v: number; color: string; height: number }> =
    [
      { id: 'pole-core', u: 0.3861, v: 0.5784, color: '#EA580C', height: 4200 },
      { id: 'pole-east-northeast', u: 0.474, v: 0.5151, color: '#0284C7', height: 3400 },
      { id: 'pole-north', u: 0.3678, v: 0.3281, color: '#E11D48', height: 3400 },
      { id: 'pole-south', u: 0.565, v: 0.8139, color: '#D97706', height: 3600 },
      { id: 'pole-west', u: 0.2467, v: 0.5682, color: '#2563EB', height: 3200 },
    ];

  const aspect = IMG_WIDTH / IMG_HEIGHT;
  const segments = 32;
  const innerR = 0.0255;
  const outerR = 0.0315;

  const features: Array<Feature<Polygon>> = poleUvCenters.map((p) => {
    const outerRing: Array<[number, number]> = [];
    const innerRing: Array<[number, number]> = [];
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      const cos = Math.cos(theta);
      const sin = Math.sin(theta);
      outerRing.push(uvToLngLat(p.u + cos * outerR, p.v + sin * outerR * aspect));
      // Reverse winding for inner cutout hole
      const thetaRev = ((segments - i) / segments) * Math.PI * 2;
      innerRing.push(
        uvToLngLat(
          p.u + Math.cos(thetaRev) * innerR,
          p.v + Math.sin(thetaRev) * innerR * aspect
        )
      );
    }

    return {
      type: 'Feature',
      properties: {
        id: p.id,
        color: p.color,
        height: p.height,
      },
      geometry: {
        type: 'Polygon',
        coordinates: [outerRing, innerRing],
      },
    };
  });

  return { type: 'FeatureCollection', features };
}

// ---------------------------------------------------------------------------
// 6. GEOMETRY ANIMATION HELPERS (FOR requestAnimationFrame)
// ---------------------------------------------------------------------------

function smoothstep(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

function smootherstep(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c * c * c * (c * (c * 6 - 15) + 10);
}

export function interpolateCamera(progress: number): {
  center: [number, number];
  zoom: number;
  pitch: number;
  bearing: number;
} {
  const p = Math.max(0, Math.min(1, progress));
  for (let i = 0; i < CAMERA_KEYFRAMES.length - 1; i++) {
    const a = CAMERA_KEYFRAMES[i];
    const b = CAMERA_KEYFRAMES[i + 1];
    if (p >= a.t && p <= b.t) {
      const local = b.t === a.t ? 1 : smootherstep((p - a.t) / (b.t - a.t));
      return {
        center: [
          a.center[0] + (b.center[0] - a.center[0]) * local,
          a.center[1] + (b.center[1] - a.center[1]) * local,
        ],
        zoom: a.zoom + (b.zoom - a.zoom) * local,
        pitch: a.pitch + (b.pitch - a.pitch) * local,
        bearing: a.bearing + (b.bearing - a.bearing) * local,
      };
    }
  }
  const last = CAMERA_KEYFRAMES[CAMERA_KEYFRAMES.length - 1];
  return {
    center: [...last.center],
    zoom: last.zoom,
    pitch: last.pitch,
    bearing: last.bearing,
  };
}

function segmentLengths(coords: Array<[number, number]>): {
  cum: number[];
  total: number;
} {
  const cum = [0];
  let total = 0;
  for (let i = 1; i < coords.length; i++) {
    const dx = coords[i][0] - coords[i - 1][0];
    const dy = coords[i][1] - coords[i - 1][1];
    total += Math.hypot(dx, dy);
    cum.push(total);
  }
  return { cum, total: total || 1 };
}

/** Slices a GeoJSON polyline from 0% to fraction (0..1) for smooth line-drawing animation */
export function slicePolyline(
  coords: Array<[number, number]>,
  fraction: number
): Array<[number, number]> {
  const f = Math.max(0, Math.min(1, fraction));
  if (f <= 0 || coords.length < 2) return [];
  if (f >= 1) return coords;

  const { cum, total } = segmentLengths(coords);
  const target = f * total;
  const out: Array<[number, number]> = [coords[0]];

  for (let i = 1; i < coords.length; i++) {
    if (cum[i] < target) {
      out.push(coords[i]);
    } else {
      const segLen = cum[i] - cum[i - 1] || 1;
      const localT = (target - cum[i - 1]) / segLen;
      out.push([
        coords[i - 1][0] + (coords[i][0] - coords[i - 1][0]) * localT,
        coords[i - 1][1] + (coords[i][1] - coords[i - 1][1]) * localT,
      ]);
      break;
    }
  }
  return out;
}

/** Extracts a moving sub-segment [startFrac .. endFrac] along a polyline for glowing comet sweep */
export function slicePolylineWindow(
  coords: Array<[number, number]>,
  startFrac: number,
  endFrac: number
): Array<[number, number]> {
  const s = Math.max(0, Math.min(1, startFrac));
  const e = Math.max(0, Math.min(1, endFrac));
  if (e <= s || coords.length < 2) return [];

  const { cum, total } = segmentLengths(coords);
  const startDist = s * total;
  const endDist = e * total;
  const out: Array<[number, number]> = [];

  for (let i = 1; i < coords.length; i++) {
    const d0 = cum[i - 1];
    const d1 = cum[i];
    if (d1 < startDist) continue;
    if (d0 > endDist) break;

    const segLen = d1 - d0 || 1;
    if (out.length === 0) {
      const t0 = Math.max(0, (startDist - d0) / segLen);
      out.push([
        coords[i - 1][0] + (coords[i][0] - coords[i - 1][0]) * t0,
        coords[i - 1][1] + (coords[i][1] - coords[i - 1][1]) * t0,
      ]);
    }

    if (d1 <= endDist) {
      out.push(coords[i]);
    } else {
      const t1 = Math.min(1, (endDist - d0) / segLen);
      out.push([
        coords[i - 1][0] + (coords[i][0] - coords[i - 1][0]) * t1,
        coords[i - 1][1] + (coords[i][1] - coords[i - 1][1]) * t1,
      ]);
      break;
    }
  }
  return out;
}

/** Samples a single moving point along a polyline at normalized distance t (0..1) */
export function samplePointAlongLine(
  coords: Array<[number, number]>,
  fraction: number
): [number, number] {
  const f = Math.max(0, Math.min(1, fraction));
  if (coords.length === 0) return uvToLngLat(0.386, 0.573);
  if (coords.length === 1 || f <= 0) return coords[0];
  if (f >= 1) return coords[coords.length - 1];

  const { cum, total } = segmentLengths(coords);
  const target = f * total;
  for (let i = 1; i < coords.length; i++) {
    if (cum[i] >= target) {
      const segLen = cum[i] - cum[i - 1] || 1;
      const localT = (target - cum[i - 1]) / segLen;
      return [
        coords[i - 1][0] + (coords[i][0] - coords[i - 1][0]) * localT,
        coords[i - 1][1] + (coords[i][1] - coords[i - 1][1]) * localT,
      ];
    }
  }
  return coords[coords.length - 1];
}

/** Builds live GeoJSON for progressive animated routes at current timeline progress */
export function buildAnimatedRoutesGeoJSON(
  timelineProgress: number
): FeatureCollection<LineString> {
  const features: Array<Feature<LineString>> = [];

  for (const route of TRANSPORT_ROUTES) {
    if (timelineProgress <= route.startAt) continue;
    const frac = Math.min(
      1,
      (timelineProgress - route.startAt) / Math.max(0.01, route.endAt - route.startAt)
    );
    const sliced = slicePolyline(route.coords, smoothstep(frac));
    if (sliced.length < 2) continue;

    features.push({
      type: 'Feature',
      properties: {
        id: route.id,
        name: route.name,
        color: route.color,
        glowColor: route.glowColor,
        isMaritime: route.isMaritime ? 1 : 0,
      },
      geometry: {
        type: 'LineString',
        coordinates: sliced,
      },
    });
  }

  return { type: 'FeatureCollection', features };
}

/** Builds live GeoJSON for animated glowing border arcs highlighting the 4 compass directions */
export function buildAnimatedBorderArcsGeoJSON(
  timelineProgress: number
): FeatureCollection<LineString> {
  const features: Array<Feature<LineString>> = [];
  for (const b of BORDER_DIRECTIONS) {
    if (timelineProgress <= b.appearAt) continue;
    const frac = Math.min(1, (timelineProgress - b.appearAt) / 0.08);
    const sliced = slicePolyline(b.arcCoords, smoothstep(frac));
    if (sliced.length < 2) continue;
    features.push({
      type: 'Feature',
      properties: { id: b.id, direction: b.direction },
      geometry: {
        type: 'LineString',
        coordinates: sliced,
      },
    });
  }
  return { type: 'FeatureCollection', features };
}

/** Builds live moving travel pulse dots gliding continuously along active routes */
export function buildMovingPulsesGeoJSON(
  timelineProgress: number,
  pulseClockSec: number
): FeatureCollection<Point> {
  const features: Array<Feature<Point>> = [];

  for (let rIdx = 0; rIdx < TRANSPORT_ROUTES.length; rIdx++) {
    const route = TRANSPORT_ROUTES[rIdx];
    if (timelineProgress <= route.startAt + 0.03) continue;
    const drawnFrac = Math.min(
      1,
      (timelineProgress - route.startAt) / Math.max(0.01, route.endAt - route.startAt)
    );

    const pulsesPerRoute = 2;
    for (let k = 0; k < pulsesPerRoute; k++) {
      const cycle = (pulseClockSec * 0.28 + rIdx * 0.19 + k * 0.5) % 1;
      const dist = cycle * drawnFrac;
      const pt = samplePointAlongLine(route.coords, dist);
      features.push({
        type: 'Feature',
        properties: {
          color: route.color,
          glowColor: route.glowColor,
        },
        geometry: {
          type: 'Point',
          coordinates: pt,
        },
      });
    }
  }

  return { type: 'FeatureCollection', features };
}

/** Builds progressive glowing boundary trace hugging the exact red-dashed perimeter */
export function buildAnimatedBoundaryTraceGeoJSON(
  timelineProgress: number
): FeatureCollection<LineString> {
  const frac = Math.max(0, Math.min(1, (timelineProgress - 0.02) / 0.18));
  const features: Array<Feature<LineString>> = [];

  const borderSlice = slicePolyline(HCMC_PINK_BORDER_LINE, smoothstep(frac));
  if (borderSlice.length >= 2) {
    features.push({
      type: 'Feature',
      properties: { id: 'pink-border-trace' },
      geometry: { type: 'LineString', coordinates: borderSlice },
    });
  }

  if (timelineProgress > 0.76) {
    const cdFrac = Math.min(1, (timelineProgress - 0.76) / 0.08);
    const cdSlice = slicePolyline(CON_DAO_RING, smoothstep(cdFrac));
    if (cdSlice.length >= 2) {
      features.push({
        type: 'Feature',
        properties: { id: 'condao-trace' },
        geometry: { type: 'LineString', coordinates: cdSlice },
      });
    }
  }

  return { type: 'FeatureCollection', features };
}

/** Builds continuous luminous light-sweep comets gliding smoothly along the exact outer border */
export function buildPinkBorderCometGeoJSON(
  timelineProgress: number,
  pulseClockSec: number
): FeatureCollection<LineString> {
  const drawnFrac = Math.max(0, Math.min(1, (timelineProgress - 0.02) / 0.18));
  if (drawnFrac <= 0.05) {
    return { type: 'FeatureCollection', features: [] };
  }

  const features: Array<Feature<LineString>> = [];
  const beamLen = 0.11;

  for (let k = 0; k < 2; k++) {
    const head = ((pulseClockSec * 0.16 + k * 0.5) % 1) * drawnFrac;
    const tail = Math.max(0, head - beamLen * drawnFrac);
    const seg = slicePolylineWindow(HCMC_PINK_BORDER_LINE, tail, head);
    if (seg.length >= 2) {
      features.push({
        type: 'Feature',
        properties: { id: `pink-comet-${k}` },
        geometry: { type: 'LineString', coordinates: seg },
      });
    }
  }

  return { type: 'FeatureCollection', features };
}
