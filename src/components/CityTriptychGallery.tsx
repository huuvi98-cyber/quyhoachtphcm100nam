import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface TriptychPhoto {
  src: string;
  alt: string;
  caption: string;
  positionClass: string;
  clipClass: string;
  objectPositionClass: string;
  originClass: string;
}

// 3 TP.HCM photos arranged in an exact 11.86° parallel slanted architectural triptych
// matching the reference composition: medium left, tall hero center, medium right.
const TRIPTYCH_PHOTOS: TriptychPhoto[] = [
  {
    src: '/assets/aistudio/TPHCM._a_nh_HOA_NG_TRIE__U_26_9210dc93.jpg',
    alt: 'Toàn cảnh trung tâm TP.HCM rực rỡ ánh đèn bên sông Sài Gòn về đêm',
    caption: 'Không gian đô thị ven sông Sài Gòn rực rỡ về đêm — Ảnh: Hoàng Triều',
    positionClass: 'left-[3.5%] top-[23%] w-[29.5%] h-[63%]',
    clipClass: '[clip-path:polygon(0%_17.8%,100%_0%,100%_82.2%,0%_100%)]',
    objectPositionClass: 'object-[58%_50%]',
    originClass: 'origin-[15%_50%]',
  },
  {
    src: '/assets/aistudio/TP_HCM_-_a_nh_Hoa_ng_Trie__u_6_181d12fb.JPG',
    alt: 'Trục đại lộ Lê Lợi hướng về Nhà hát Thành phố và khu trung tâm TP.HCM',
    caption: 'Trục trung tâm đại lộ Lê Lợi và không gian kiến trúc lõi đô thị — Ảnh: Hoàng Triều',
    positionClass: 'left-[34.75%] top-[4%] w-[30.5%] h-[92%]',
    clipClass: '[clip-path:polygon(0%_12.8%,100%_0%,100%_87.2%,0%_100%)]',
    objectPositionClass: 'object-center',
    originClass: 'origin-center',
  },
  {
    src: '/assets/aistudio/TPHCM._a_nh_HOA_NG_TRIE__U_25_799bfc22.jpg',
    alt: 'Cửa ngõ phía Đông TP.HCM với Xa lộ Hà Nội, tuyến Metro số 1 và Landmark 81',
    caption: 'Trục phát triển phía Đông, tuyến Metro số 1 và tổ hợp cao tầng — Ảnh: Hoàng Triều',
    positionClass: 'left-[67%] top-[18.5%] w-[29.5%] h-[63%]',
    clipClass: '[clip-path:polygon(0%_17.8%,100%_0%,100%_82.2%,0%_100%)]',
    objectPositionClass: 'object-[36%_45%]',
    originClass: 'origin-[85%_50%]',
  },
];

export function CityTriptychGallery() {
  const [activePhoto, setActivePhoto] = useState<TriptychPhoto | null>(null);

  useEffect(() => {
    if (!activePhoto) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActivePhoto(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activePhoto]);

  return (
    <section
      aria-label="Bộ ảnh không gian đô thị TP.HCM"
      className="w-full mt-6 md:mt-8 lg:mt-10 py-4 sm:py-6 md:py-8"
    >
      {/* Scaled down 40% (60% width centered) while keeping all 3 slanted frames mathematically parallel */}
      <div className="relative w-[60%] min-w-[300px] mx-auto aspect-[1200/640] select-none">
        {/* Background & corner geometric accents aligned strictly to the exact 11.86° slope (dy/dx = 0.21) */}
        <svg
          viewBox="0 0 1200 640"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="pointer-events-none absolute inset-0 w-full h-full"
          aria-hidden="true"
        >
          {/* Left outer slanted warm-gold accent tab peeking behind Left photo */}
          <polygon
            points="10,326 52,317 52,459 10,468"
            fill="#FED84D"
            fillOpacity="0.94"
          />

          {/* Right outer slanted sky-navy accent tab peeking behind Right photo */}
          <polygon
            points="1148,192 1190,183 1190,325 1148,334"
            fill="#073169"
            fillOpacity="0.88"
          />
          <polygon
            points="1148,192 1190,183 1190,195 1148,204"
            fill="#7DD3FC"
            fillOpacity="0.85"
          />

          {/* Top-right slanted gold square dot above Left photo */}
          <polygon
            points="366,104 402,96.4 402,132.4 366,140"
            fill="#FED84D"
          />

          {/* Bottom-left slanted cyan square dot below Right photo */}
          <polygon
            points="804,548 840,540.4 840,576.4 804,584"
            fill="#7DD3FC"
          />

          {/* Bottom-right L-bracket framing Left photo */}
          <polyline
            points="324,522 396,506.9 396,568"
            stroke="#FED84D"
            strokeWidth="7"
            strokeLinecap="square"
            strokeLinejoin="miter"
          />

          {/* Bottom-right L-bracket framing Right photo */}
          <polyline
            points="1084,489 1172,470.5 1172,412"
            stroke="#FED84D"
            strokeWidth="7"
            strokeLinecap="square"
            strokeLinejoin="miter"
          />

          {/* Subtle architectural top brackets above Right photo */}
          <polyline
            points="806,120 806,162 856,151.5"
            stroke="#E0F2FE"
            strokeOpacity="0.88"
            strokeWidth="5"
            strokeLinecap="square"
            strokeLinejoin="miter"
          />
          <polyline
            points="1104,59 1154,48.5 1154,90.5"
            stroke="#E0F2FE"
            strokeOpacity="0.88"
            strokeWidth="5"
            strokeLinecap="square"
            strokeLinejoin="miter"
          />
        </svg>

        {/* 3 Slanted White-Framed Architectural Photo Panels (each scales smoothly +20% on hover) */}
        {TRIPTYCH_PHOTOS.map((photo) => (
          <button
            key={photo.src}
            type="button"
            onClick={() => setActivePhoto(photo)}
            aria-label={`Xem lớn: ${photo.alt}`}
            className={`group absolute ${photo.positionClass} ${photo.originClass} z-10 hover:z-30 focus-visible:z-30 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FED84D] drop-shadow-[0_18px_28px_rgba(4,28,68,0.42)] hover:drop-shadow-[0_28px_46px_rgba(3,20,52,0.62)] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[1.2]`}
          >
            {/* Crisp white outer slanted parallelogram frame */}
            <div className={`relative w-full h-full bg-white ${photo.clipClass}`}>
              {/* Uniform inset reveals an even crisp white border around all 4 slanted edges */}
              <div
                className={`absolute inset-[3px] sm:inset-[5px] md:inset-[6px] lg:inset-[7px] overflow-hidden bg-[#083A7A] ${photo.clipClass}`}
              >
                <img
                  src={photo.src}
                  alt={photo.alt}
                  loading="eager"
                  className={`w-full h-full object-cover ${photo.objectPositionClass}`}
                />
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Fullscreen Lightbox when clicking any of the 3 photos */}
      {activePhoto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={activePhoto.alt}
          onClick={() => setActivePhoto(null)}
          className="fixed inset-0 z-50 bg-[#05234D]/92 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-5xl w-full flex flex-col items-center"
          >
            <button
              type="button"
              onClick={() => setActivePhoto(null)}
              aria-label="Đóng xem ảnh"
              className="self-end mb-3 inline-flex items-center justify-center w-9 h-9 bg-white/12 hover:bg-white/22 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={activePhoto.src}
              alt={activePhoto.alt}
              className="w-full max-h-[80vh] object-contain border-4 border-white shadow-2xl bg-[#072B5E]"
            />
            <p className="mt-3 text-sm sm:text-base text-[#E2F0FF] text-center">
              {activePhoto.caption}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
