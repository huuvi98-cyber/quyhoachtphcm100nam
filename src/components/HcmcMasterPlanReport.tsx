import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

interface CountUpElement extends HTMLElement {
  _countRafId?: number | null;
}

export function HcmcMasterPlanReport() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    Chart.defaults.font.family = '"Be Vietnam Pro", "Inter", system-ui, sans-serif';

    const cleanups: Array<() => void> = [];
    const observers: IntersectionObserver[] = [];
    const intervals: number[] = [];
    const rafIds: number[] = [];

    const q = <T extends HTMLElement = HTMLElement>(selector: string): T | null =>
      root.querySelector<T>(selector);
    const qa = <T extends HTMLElement = HTMLElement>(selector: string): NodeListOf<T> =>
      root.querySelectorAll<T>(selector);
    const byId = <T extends HTMLElement = HTMLElement>(id: string): T | null =>
      root.querySelector<T>(`#${id}`);

    const on = (
      target: EventTarget | null,
      event: string,
      handler: EventListenerOrEventListenerObject,
      options?: AddEventListenerOptions | boolean
    ) => {
      if (!target) return;
      target.addEventListener(event, handler, options);
      cleanups.push(() => target.removeEventListener(event, handler, options));
    };

    // 3. Part 2 Interactive Admin Bar & Compass Direction Highlight
    const adminCards = qa(".admin-unit-card");
    const adminBars = ["barPhuong", "barXa", "barConDao"]
      .map((id) => byId(id))
      .filter((el): el is HTMLElement => Boolean(el));
    adminCards.forEach((card) => {
      const targetBarId = card.getAttribute("data-bar");
      on(card, "mouseenter", () => {
        adminBars.forEach((bar) => {
          bar.style.opacity = bar.id === targetBarId ? "1" : "0.35";
        });
      });
      on(card, "mouseleave", () => {
        adminBars.forEach((bar) => {
          bar.style.opacity = "1";
        });
      });
    });

    const dirElements = qa(".compass-dir");
    dirElements.forEach((el) => {
      on(el, "mouseenter", () => {
        dirElements.forEach((d) => d.classList.remove("scale-105", "bg-blue-50"));
        el.classList.add("scale-105", "bg-blue-50");
      });
      on(el, "mouseleave", () => {
        dirElements.forEach((d) => d.classList.remove("scale-105", "bg-blue-50"));
      });
    });

    // 4. Part 3 Chart.js Layer Switching (Population, Land, Labor)
    let part3ChartInstance: Chart | null = null;
    const part3Data = {
      years: ["2030", "2035", "2040", "2045", "2050"],
      pop: {
        title: "Biểu đồ Dân số (triệu người)",
        type: "bar" as const,
        label: "Dân số (Triệu người)",
        data: [18, 20.5, 23, 25, 27] as Array<number | null>,
        color: "#FF4D1C",
        bg: "rgba(255, 77, 28, 0.85)",
        btnActiveClass: "bg-energy text-white",
      },
      land: {
        title: "Quy mô đất xây dựng toàn thành phố (nghìn ha)",
        type: "bar" as const,
        label: "Đất xây dựng tối đa (nghìn ha)",
        data: [290, 315, 345, 362, 390] as Array<number | null>,
        color: "#00C896",
        bg: "rgba(0, 200, 150, 0.85)",
        btnActiveClass: "bg-mint text-white",
      },
      labor: {
        title: "Quy mô lao động (triệu người)",
        type: "line" as const,
        label: "Lao động (Triệu người)",
        data: [8.2, null, 9.9, 10.7, 11.3] as Array<number | null>,
        color: "#0057FF",
        bg: "rgba(0, 87, 255, 0.2)",
        btnActiveClass: "bg-cobalt text-white",
      },
    };
    type Part3LayerKey = "pop" | "land" | "labor";
    let currentPart3Layer: Part3LayerKey = "pop";

    const buildPart3Chart = (layer: Part3LayerKey) => {
      const ctx = byId<HTMLCanvasElement>("part3ChartCanvas");
      if (!ctx) return;
      if (part3ChartInstance) {
        part3ChartInstance.destroy();
        part3ChartInstance = null;
      }
      const cfg = part3Data[layer];
      part3ChartInstance = new Chart(ctx, {
        type: cfg.type,
        data: {
          labels: part3Data.years,
          datasets: [
            {
              label: cfg.label,
              data: cfg.data,
              backgroundColor: cfg.bg,
              borderColor: cfg.color,
              borderWidth: 2,
              ...(cfg.type === "bar"
                ? { borderRadius: 8 }
                : {
                    spanGaps: true,
                    tension: 0.3,
                    borderDash: [5, 5],
                    fill: true,
                  }),
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
          },
          scales: {
            y: {
              beginAtZero: true,
              min: 0,
              grid: { color: "#E2E8F0" },
              ticks: {
                color: "#64748B",
                font: { weight: 600 },
              },
            },
            x: {
              grid: { display: false },
              ticks: {
                color: "#334155",
                font: { weight: "bold" },
              },
            },
          },
        },
      });
    };

    const switchPart3Layer = (layer: Part3LayerKey) => {
      currentPart3Layer = layer;
      const tabBtns = qa(".part3-tab-btn");
      tabBtns.forEach((btn) => {
        const btnLayer = btn.getAttribute("data-layer");
        if (btnLayer === layer) {
          btn.className =
            "part3-tab-btn px-3 py-1.5 rounded-xl text-xs font-black transition-all " +
            part3Data[layer].btnActiveClass;
        } else {
          btn.className =
            "part3-tab-btn px-3 py-1.5 rounded-xl text-xs font-black bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all";
        }
      });

      const titleEl = byId("chartPart3Title");
      if (titleEl) titleEl.innerText = part3Data[layer].title;
      buildPart3Chart(layer);
    };

    const part3Canvas = byId("part3ChartCanvas");
    if (part3Canvas && "IntersectionObserver" in window) {
      const p3ChartObs = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              buildPart3Chart(currentPart3Layer);
              obs.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15 }
      );
      p3ChartObs.observe(part3Canvas);
      observers.push(p3ChartObs);
    } else {
      buildPart3Chart("pop");
    }

    qa(".part3-tab-btn, .part3-row").forEach((el) => {
      on(el, "click", () => {
        const layer = el.getAttribute("data-layer") as Part3LayerKey | null;
        if (layer && (layer === "pop" || layer === "land" || layer === "labor")) {
          switchPart3Layer(layer);
        }
      });
    });

    // 5. Part 4 Scrollytelling Roadmap Logic
    const dotColors = [
      { active: "bg-sun text-slate-950", border: "border-sun" },
      { active: "bg-mint text-slate-950", border: "border-mint" },
      { active: "bg-energy text-white", border: "border-energy" },
    ];

    const setRoadmapStage = (idx: number) => {
      if (idx < 0 || idx > 2) return;
      for (let i = 0; i <= 2; i++) {
        const imgEl = byId("roadmapImg" + i);
        const stepEl = byId("roadmapStep" + i);

        if (imgEl) {
          if (i === idx) {
            imgEl.classList.remove("opacity-0");
            imgEl.classList.add("opacity-100");
          } else {
            imgEl.classList.remove("opacity-100");
            imgEl.classList.add("opacity-0");
          }
        }

        if (stepEl) {
          const innerCard = stepEl.firstElementChild;
          if (i === idx) {
            stepEl.classList.add("active");
            if (innerCard) {
              innerCard.classList.remove("border-transparent");
              innerCard.classList.add(dotColors[i].border);
            }
          } else {
            stepEl.classList.remove("active");
            if (innerCard) {
              innerCard.classList.remove("border-sun", "border-mint", "border-energy");
              innerCard.classList.add("border-transparent");
            }
          }
        }
      }
    };

    const roadmapSteps = [0, 1, 2]
      .map((i) => byId("roadmapStep" + i))
      .filter((el): el is HTMLElement => Boolean(el));

    roadmapSteps.forEach((stepEl) => {
      on(stepEl, "click", () => {
        const idx = parseInt(stepEl.getAttribute("data-step") || "", 10);
        if (!Number.isNaN(idx)) {
          setRoadmapStage(idx);
          stepEl.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      });
    });

    if (roadmapSteps.length && "IntersectionObserver" in window) {
      const roadmapObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const stepIdx = parseInt(entry.target.getAttribute("data-step") || "", 10);
              if (!Number.isNaN(stepIdx)) {
                setRoadmapStage(stepIdx);
              }
            }
          });
        },
        {
          root: null,
          rootMargin: "-30% 0px -40% 0px",
          threshold: 0.2,
        }
      );
      roadmapSteps.forEach((step) => roadmapObserver.observe(step));
      observers.push(roadmapObserver);
    }

    // 6. Part 5 GRDP Chart & Stage Manager
    let grdpChartInstance: Chart | null = null;
    const grdpStages = [
      { year: "2030", growth: "≥ 10,5%/năm", total: "200 - 225 Tỷ USD", perCapita: "14.500 USD", note: "Giai đoạn 2026-2030" },
      { year: "2035", growth: "≥ 10%/năm", total: "400 - 450 Tỷ USD", perCapita: "25.000 USD", note: "Giai đoạn 2031-2035" },
      { year: "2045", growth: "≥ 10%/năm", total: "1.300 - 1.700 Tỷ USD", perCapita: "75.000 USD", note: "Giai đoạn 2036-2045" },
      { year: "2075+", growth: "≥ 6%/năm", total: "", perCapita: "100.000 USD", note: "Giai đoạn 2046-2075" },
    ];

    const initGRDPChart = () => {
      const ctx = byId<HTMLCanvasElement>("grdpChartCanvas");
      if (!ctx) return;
      if (grdpChartInstance) {
        grdpChartInstance.destroy();
        grdpChartInstance = null;
      }
      grdpChartInstance = new Chart(ctx, {
        type: "bar",
        data: {
          labels: ["2030", "2035", "2045", "2075+"],
          datasets: [
            {
              label: "GRDP bình quân đầu người ",
              data: [14500, 25000, 75000, 100000],
              backgroundColor: ["#0057FF", "#00C896", "#00A8E8", "#FFB800"],
              borderRadius: 8,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: "#E2E8F0" },
              ticks: { color: "#64748B", font: { weight: 600 } },
            },
            x: {
              grid: { display: false },
              ticks: { color: "#0F172A", font: { weight: "bold" } },
            },
          },
        },
      });
    };

    // 10. Scroll-Triggered Number Count-Up, Rings, Stacked Bar & Lazy GRDP Chart Engine
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const NUMBER_TOKEN_REGEX = /\d+(?:\.\d{3})*(?:,\d+)?/g;

    interface NumericToken {
      value: number;
      decimals: number;
      useThousands: boolean;
      padLength: number;
    }

    const parseNumericTemplate = (targetText: string) => {
      const tokens: NumericToken[] = [];
      const parts: Array<string | null> = [];
      let lastIndex = 0;
      let match: RegExpExecArray | null;
      NUMBER_TOKEN_REGEX.lastIndex = 0;
      while ((match = NUMBER_TOKEN_REGEX.exec(targetText)) !== null) {
        parts.push(targetText.slice(lastIndex, match.index));
        const raw = match[0];
        const useThousands = raw.indexOf(".") !== -1;
        const commaIdx = raw.indexOf(",");
        const decimals = commaIdx !== -1 ? raw.length - commaIdx - 1 : 0;
        const padLength =
          decimals === 0 && !useThousands && raw.length > 1 && raw.charAt(0) === "0"
            ? raw.length
            : 0;
        const value = parseFloat(raw.replace(/\./g, "").replace(",", "."));
        tokens.push({ value, decimals, useThousands, padLength });
        parts.push(null);
        lastIndex = match.index + raw.length;
      }
      parts.push(targetText.slice(lastIndex));
      return { parts, tokens };
    };

    const formatTokenAtProgress = (token: NumericToken, eased: number) => {
      const current = token.value * eased;
      if (token.decimals > 0) {
        const fixed = current.toFixed(token.decimals);
        const splitParts = fixed.split(".");
        let intPart = splitParts[0];
        const decPart = splitParts[1];
        if (token.useThousands) {
          intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        }
        return intPart + "," + decPart;
      }
      const rounded = Math.round(current);
      let str = String(rounded);
      if (token.padLength > 0) {
        str = str.padStart(token.padLength, "0");
      } else if (token.useThousands) {
        str = str.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      }
      return str;
    };

    const renderTemplateAtProgress = (
      parsed: { parts: Array<string | null>; tokens: NumericToken[] },
      eased: number
    ) => {
      let tokenIdx = 0;
      let out = "";
      for (let i = 0; i < parsed.parts.length; i++) {
        if (parsed.parts[i] === null) {
          out += formatTokenAtProgress(parsed.tokens[tokenIdx++], eased);
        } else {
          out += parsed.parts[i];
        }
      }
      return out;
    };

    const animateCountUpElement = (
      el: CountUpElement | null,
      targetText: string,
      duration = 1250
    ) => {
      if (!el) return;
      if (el._countRafId) {
        cancelAnimationFrame(el._countRafId);
        el._countRafId = null;
      }
      if (!targetText || prefersReducedMotion) {
        el.textContent = targetText;
        el.dataset.countAnimated = "true";
        return;
      }
      const parsed = parseNumericTemplate(targetText);
      if (!parsed.tokens.length) {
        el.textContent = targetText;
        el.dataset.countAnimated = "true";
        return;
      }
      el.dataset.countAnimated = "true";
      const startTime = performance.now();
      const step = (now: number) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        if (progress >= 1) {
          el.textContent = targetText;
          el._countRafId = null;
        } else {
          el.textContent = renderTemplateAtProgress(parsed, eased);
          const id = requestAnimationFrame(step);
          el._countRafId = id;
          rafIds.push(id);
        }
      };
      el.textContent = renderTemplateAtProgress(parsed, 0);
      const id = requestAnimationFrame(step);
      el._countRafId = id;
      rafIds.push(id);
    };

    const animateRingElement = (pathEl: SVGElement | null, targetPercent: number, duration = 1250) => {
      if (!pathEl) return;
      if (prefersReducedMotion) {
        pathEl.setAttribute("stroke-dasharray", targetPercent + ", 100");
        return;
      }
      const startTime = performance.now();
      const step = (now: number) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const cur = (targetPercent * eased).toFixed(1);
        pathEl.setAttribute("stroke-dasharray", (progress >= 1 ? targetPercent : cur) + ", 100");
        if (progress < 1) {
          const id = requestAnimationFrame(step);
          rafIds.push(id);
        }
      };
      const id = requestAnimationFrame(step);
      rafIds.push(id);
    };

    const grdpCards = qa(".grdp-stage-card");
    const updateGRDPStage = (idx: number) => {
      const s = grdpStages[idx];
      if (!s) return;
      const yLbl = byId("grdpYearLabel");
      const gVal = byId<CountUpElement>("grdpGrowthVal");
      const tVal = byId<CountUpElement>("grdpTotalVal");
      const pVal = byId<CountUpElement>("grdpPerCapitaVal");

      if (yLbl) yLbl.innerText = "Năm " + s.year;
      if (gVal) {
        gVal.dataset.countTarget = s.growth;
        animateCountUpElement(gVal, s.growth, 700);
      }
      if (tVal) {
        tVal.dataset.countTarget = s.total;
        if (s.total) {
          animateCountUpElement(tVal, s.total, 750);
        } else {
          if (tVal._countRafId) cancelAnimationFrame(tVal._countRafId);
          tVal.textContent = "";
          tVal.dataset.countAnimated = "true";
        }
      }
      if (pVal) {
        pVal.dataset.countTarget = s.perCapita;
        animateCountUpElement(pVal, s.perCapita, 850);
      }

      grdpCards.forEach((card, cIdx) => {
        if (cIdx === idx) {
          card.classList.add("ring-2", "ring-white");
        } else {
          card.classList.remove("ring-2", "ring-white", "ring-sun/60");
        }
      });
    };

    const grdpCanvas = byId("grdpChartCanvas");
    if (grdpCanvas && "IntersectionObserver" in window) {
      const grdpChartObs = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              initGRDPChart();
              obs.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15 }
      );
      grdpChartObs.observe(grdpCanvas);
      observers.push(grdpChartObs);
    } else {
      initGRDPChart();
    }

    grdpCards.forEach((card) => {
      on(card, "click", () => {
        const idx = parseInt(card.getAttribute("data-stage") || "", 10);
        if (!Number.isNaN(idx)) updateGRDPStage(idx);
      });
    });

    // 7. Part 6.1 Flip Cards (click/tap support on touch devices)
    qa(".flip-card").forEach((card) => {
      on(card, "click", () => {
        const inner = card.querySelector(".flip-card-inner");
        if (inner) inner.classList.toggle("is-flipped");
      });
    });

    // 8. Part 6.2 Satellite 3D Carousel
    let activeSatelliteIdx = 0;
    const totalSatellites = 5;
    const satelliteCards = qa(".satellite-card");
    const satPageIndicator = byId("satPageIndicator");
    const satDots = qa(".sat-dot");

    const updateSatellite3DCarousel = () => {
      if (satPageIndicator) {
        satPageIndicator.textContent = activeSatelliteIdx + 1 + " / " + totalSatellites;
      }
      satDots.forEach((d, idx) => {
        if (idx === activeSatelliteIdx) {
          d.className = "w-3 h-2.5 rounded-full bg-mint transition-all sat-dot";
        } else {
          d.className = "w-2 h-2 rounded-full bg-slate-300 transition-all sat-dot";
        }
      });

      satelliteCards.forEach((card) => {
        const idx = parseInt(card.getAttribute("data-index") || "0", 10);
        let diff = (idx - activeSatelliteIdx) % totalSatellites;
        if (diff < -2) diff += totalSatellites;
        if (diff > 2) diff -= totalSatellites;

        card.className =
          "satellite-card absolute transition-all duration-500 ease-in-out cursor-pointer w-[300px] sm:w-[380px] bg-white rounded-3xl p-5 sm:p-6 ";
        if (diff === 0) {
          card.className +=
            "border-2 border-mint shadow-2xl z-20 scale-100 opacity-100 -translate-x-0 pointer-events-auto";
        } else if (diff === 1) {
          card.className +=
            "border border-slate-200 shadow-lg z-10 scale-90 opacity-60 translate-x-[70%] sm:translate-x-[65%] pointer-events-auto";
        } else if (diff === -1) {
          card.className +=
            "border border-slate-200 shadow-lg z-10 scale-90 opacity-60 -translate-x-[70%] sm:-translate-x-[65%] pointer-events-auto";
        } else if (diff > 1) {
          card.className +=
            "border border-slate-200 shadow-md z-0 scale-75 opacity-0 translate-x-[110%] pointer-events-none";
        } else {
          card.className +=
            "border border-slate-200 shadow-md z-0 scale-75 opacity-0 -translate-x-[110%] pointer-events-none";
        }
      });
    };

    satelliteCards.forEach((card) => {
      on(card, "click", () => {
        const idx = parseInt(card.getAttribute("data-index") || "", 10);
        if (!Number.isNaN(idx)) {
          activeSatelliteIdx = idx;
          updateSatellite3DCarousel();
        }
      });
    });

    satDots.forEach((dot) => {
      on(dot, "click", () => {
        const idx = parseInt(dot.getAttribute("data-index") || "", 10);
        if (!Number.isNaN(idx)) {
          activeSatelliteIdx = idx;
          updateSatellite3DCarousel();
        }
      });
    });

    on(byId("satPrevBtn"), "click", () => {
      activeSatelliteIdx = (activeSatelliteIdx - 1 + totalSatellites) % totalSatellites;
      updateSatellite3DCarousel();
    });
    on(byId("satNextBtn"), "click", () => {
      activeSatelliteIdx = (activeSatelliteIdx + 1) % totalSatellites;
      updateSatellite3DCarousel();
    });
    updateSatellite3DCarousel();

    // 8.5 Part 6.3 10 Governance Zones Carousel with 1-10 Timeline
    const zonesCarouselWrapper = byId("zonesCarouselWrapper");
    if (zonesCarouselWrapper) {
      const zoneCards = zonesCarouselWrapper.querySelectorAll<HTMLElement>(".zone-slide-card");
      const zoneMilestones = zonesCarouselWrapper.querySelectorAll<HTMLElement>(".zone-milestone");
      const zoneProgressLine = byId("zoneTimelineProgress");
      const zoneCounterMobile = byId("zoneCounterMobile");
      const totalZones = zoneCards.length;
      let activeZoneIdx = 0;

      const setActiveZone = (nextIdx: number, direction = 1, shouldAnimateNumbers = true) => {
        if (totalZones === 0) return;
        const normalizedIdx = ((nextIdx % totalZones) + totalZones) % totalZones;
        activeZoneIdx = normalizedIdx;

        if (zoneProgressLine && totalZones > 1) {
          zoneProgressLine.style.width = (normalizedIdx / (totalZones - 1)) * 100 + "%";
        }
        if (zoneCounterMobile) {
          zoneCounterMobile.textContent = normalizedIdx + 1 + " / " + totalZones;
        }

        zoneMilestones.forEach((btn, idx) => {
          if (idx === normalizedIdx) {
            btn.className =
              "zone-milestone relative z-10 w-7 h-7 sm:w-10 sm:h-10 rounded-full border-2 border-amber-500 bg-sun text-slate-950 text-xs sm:text-sm font-black font-display flex items-center justify-center shadow-md ring-4 ring-sun/25 scale-110 transition-all cursor-pointer";
            btn.setAttribute("aria-current", "step");
          } else if (idx < normalizedIdx) {
            btn.className =
              "zone-milestone relative z-10 w-7 h-7 sm:w-10 sm:h-10 rounded-full border-2 border-sun bg-amber-100 text-amber-800 hover:bg-sun/40 text-xs sm:text-sm font-bold font-display flex items-center justify-center transition-all cursor-pointer";
            btn.removeAttribute("aria-current");
          } else {
            btn.className =
              "zone-milestone relative z-10 w-7 h-7 sm:w-10 sm:h-10 rounded-full border-2 border-slate-300 bg-white text-slate-600 hover:border-sun hover:text-amber-700 text-xs sm:text-sm font-bold font-display flex items-center justify-center transition-all cursor-pointer";
            btn.removeAttribute("aria-current");
          }
        });

        zoneCards.forEach((card, idx) => {
          card.classList.remove("zone-enter-right", "zone-enter-left");
          if (idx === normalizedIdx) {
            card.classList.remove("hidden");
            void card.offsetWidth;
            card.classList.add(direction >= 0 ? "zone-enter-right" : "zone-enter-left");
            if (shouldAnimateNumbers) {
              card.querySelectorAll<CountUpElement>("[data-countup]").forEach((el) => {
                const target = el.dataset.countTarget || (el.textContent || "").trim();
                if (target) animateCountUpElement(el, target, 650);
              });
            }
          } else {
            card.classList.add("hidden");
          }
        });
      };

      const goPrevZone = () => setActiveZone(activeZoneIdx - 1, -1, true);
      const goNextZone = () => setActiveZone(activeZoneIdx + 1, 1, true);

      ["zonePrevBtn", "zonePrevBtnMobile"].forEach((id) => on(byId(id), "click", goPrevZone));
      ["zoneNextBtn", "zoneNextBtnMobile"].forEach((id) => on(byId(id), "click", goNextZone));

      zoneMilestones.forEach((btn) => {
        on(btn, "click", () => {
          const idx = parseInt(btn.getAttribute("data-zone-dot") || "", 10);
          if (!Number.isNaN(idx) && idx !== activeZoneIdx) {
            setActiveZone(idx, idx > activeZoneIdx ? 1 : -1, true);
          }
        });
      });

      on(zonesCarouselWrapper, "keydown", (e) => {
        const ke = e as KeyboardEvent;
        if (ke.key === "ArrowLeft") {
          ke.preventDefault();
          goPrevZone();
        } else if (ke.key === "ArrowRight") {
          ke.preventDefault();
          goNextZone();
        }
      });

      let touchStartX = 0;
      const zoneStage = byId("zoneCardsStage");
      if (zoneStage) {
        on(
          zoneStage,
          "touchstart",
          (e) => {
            const te = e as TouchEvent;
            if (te.changedTouches && te.changedTouches[0]) {
              touchStartX = te.changedTouches[0].clientX;
            }
          },
          { passive: true }
        );
        on(
          zoneStage,
          "touchend",
          (e) => {
            const te = e as TouchEvent;
            if (te.changedTouches && te.changedTouches[0]) {
              const dx = te.changedTouches[0].clientX - touchStartX;
              if (Math.abs(dx) > 45) {
                if (dx < 0) goNextZone();
                else goPrevZone();
              }
            }
          },
          { passive: true }
        );
      }

      setActiveZone(0, 1, false);
    }

    // 9. Auto Photo Slideshows (Part 6 & Part 8)
    const slideshowContainers = qa(".auto-photo-slideshow");
    slideshowContainers.forEach((slideshowContainer) => {
      const slides = slideshowContainer.querySelectorAll<HTMLElement>(".slideshow-slide");
      const dots = slideshowContainer.querySelectorAll<HTMLElement>(".auto-slide-dot");
      const totalAutoSlides = slides.length;
      if (!totalAutoSlides) return;
      let currentAutoSlide = 0;
      let autoSlideTimer: number | null = null;

      const updateSlideshowUI = (nextIdx: number) => {
        slides.forEach((slide, idx) => {
          if (idx === nextIdx) {
            slide.classList.remove("opacity-0", "z-0", "pointer-events-none");
            slide.classList.add("opacity-100", "z-10", "pointer-events-auto");
          } else {
            slide.classList.remove("opacity-100", "z-10", "pointer-events-auto");
            slide.classList.add("opacity-0", "z-0", "pointer-events-none");
          }
        });

        dots.forEach((dot, idx) => {
          if (idx === nextIdx) {
            dot.classList.remove("bg-white/40");
            dot.classList.add("bg-white", "scale-125");
          } else {
            dot.classList.remove("bg-white", "scale-125");
            dot.classList.add("bg-white/40");
          }
        });

        currentAutoSlide = nextIdx;
      };

      const startAutoSlideTimer = () => {
        if (autoSlideTimer !== null) window.clearInterval(autoSlideTimer);
        autoSlideTimer = window.setInterval(() => {
          const next = (currentAutoSlide + 1) % totalAutoSlides;
          updateSlideshowUI(next);
        }, 5000);
        intervals.push(autoSlideTimer);
      };

      on(slideshowContainer.querySelector(".slideshow-prev-btn"), "click", () => {
        const next = (currentAutoSlide - 1 + totalAutoSlides) % totalAutoSlides;
        updateSlideshowUI(next);
        startAutoSlideTimer();
      });
      on(slideshowContainer.querySelector(".slideshow-next-btn"), "click", () => {
        const next = (currentAutoSlide + 1) % totalAutoSlides;
        updateSlideshowUI(next);
        startAutoSlideTimer();
      });

      dots.forEach((dot) => {
        on(dot, "click", () => {
          const index = parseInt(dot.getAttribute("data-slide") || "", 10);
          if (!Number.isNaN(index) && index >= 0 && index < totalAutoSlides) {
            updateSlideshowUI(index);
            startAutoSlideTimer();
          }
        });
      });

      updateSlideshowUI(0);
      startAutoSlideTimer();
    });

    // Initialize Scroll-Triggered Count-Up Observers
    const countUpEls = qa<CountUpElement>("[data-countup]");
    const ringAnimEls = root.querySelectorAll<SVGElement>("[data-ring-anim]");
    const stackedBar = byId("adminStackedBar");
    const barSegs = stackedBar
      ? [
          { el: byId("barPhuong"), width: "67.26%" },
          { el: byId("barXa"), width: "32.14%" },
          { el: byId("barConDao"), width: "0.6%" },
        ].filter((item): item is { el: HTMLElement; width: string } => Boolean(item.el))
      : [];

    if (!prefersReducedMotion && "IntersectionObserver" in window) {
      countUpEls.forEach((el) => {
        const target = el.dataset.countTarget || (el.textContent || "").trim();
        el.dataset.countTarget = target;
        el.dataset.countAnimated = "false";
        const rect = el.getBoundingClientRect();
        if (rect.bottom < 0) {
          el.dataset.countAnimated = "true";
          el.textContent = target;
        } else {
          const parsed = parseNumericTemplate(target);
          if (parsed.tokens.length) {
            el.textContent = renderTemplateAtProgress(parsed, 0);
          }
        }
      });

      ringAnimEls.forEach((pathEl) => {
        const rect = pathEl.getBoundingClientRect();
        if (rect.bottom >= 0) {
          pathEl.setAttribute("stroke-dasharray", "0, 100");
        }
      });

      if (stackedBar && stackedBar.getBoundingClientRect().bottom >= 0) {
        barSegs.forEach((item) => {
          item.el.style.width = "0%";
        });
      }

      const countObserver = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const el = entry.target as CountUpElement;
            if (el.dataset.countAnimated !== "true") {
              const target = el.dataset.countTarget || (el.textContent || "").trim();
              const duration = target.length > 6 ? 1400 : 1150;
              animateCountUpElement(el, target, duration);
            }
            obs.unobserve(el);
          });
        },
        {
          root: null,
          rootMargin: "0px 0px -30px 0px",
          threshold: 0.2,
        }
      );
      observers.push(countObserver);

      countUpEls.forEach((el) => {
        if (el.dataset.countAnimated !== "true") {
          countObserver.observe(el);
        }
      });

      const ringObserver = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const pathEl = entry.target as SVGElement;
            const targetPct = parseFloat(pathEl.getAttribute("data-ring-target") || "100");
            animateRingElement(pathEl, targetPct, 1250);
            obs.unobserve(pathEl);
          });
        },
        { threshold: 0.2 }
      );
      observers.push(ringObserver);

      ringAnimEls.forEach((pathEl) => {
        if (pathEl.getBoundingClientRect().bottom >= 0) {
          ringObserver.observe(pathEl);
        }
      });

      if (stackedBar && stackedBar.getBoundingClientRect().bottom >= 0) {
        const barObserver = new IntersectionObserver(
          (entries, obs) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              const id = requestAnimationFrame(() => {
                barSegs.forEach((item) => {
                  item.el.style.width = item.width;
                });
              });
              rafIds.push(id);
              obs.unobserve(entry.target);
            });
          },
          { threshold: 0.25 }
        );
        barObserver.observe(stackedBar);
        observers.push(barObserver);
      }

      on(
        window,
        "scroll",
        () => {
          countUpEls.forEach((el) => {
            if (el.dataset.countAnimated !== "true") {
              const rect = el.getBoundingClientRect();
              if (rect.bottom < 0) {
                el.textContent = el.dataset.countTarget || el.textContent;
                el.dataset.countAnimated = "true";
              }
            }
          });
        },
        { passive: true }
      );
    }

    // Keep reference to q to satisfy strict unused checks if needed
    void q;

    return () => {
      cleanups.forEach((fn) => fn());
      observers.forEach((obs) => obs.disconnect());
      intervals.forEach((id) => window.clearInterval(id));
      rafIds.forEach((id) => cancelAnimationFrame(id));
      if (part3ChartInstance) {
        part3ChartInstance.destroy();
        part3ChartInstance = null;
      }
      if (grdpChartInstance) {
        grdpChartInstance.destroy();
        grdpChartInstance = null;
      }
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="editorial-report-scope w-full bg-white text-slate-800 antialiased selection:bg-cobalt selection:text-white relative"
    >



    {/* ========================================== */}
    {/* PHẦN 2: DIỆN TÍCH, ĐƠN VỊ HÀNH CHÍNH,       */}
    {/* TẦM NHÌN & BẢN ĐỒ RANH GIỚI (NỀN TRẮNG)   */}
    {/* ========================================== */}
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" id="sec-part2">
      {/* Khối 2.1 - Hiển thị tương tác Diện tích & Hành chính */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16">
        {/* Cột trái: Con số khổng lồ & Văn bản nguyên văn */}
        <div className="lg:col-span-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-6 rounded-2xl bg-icegray border border-slate-200">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Diện tích quy hoạch</span>
              <div className="text-4xl sm:text-5xl font-black font-display text-cobalt huge-num tabular-nums mt-2" data-countup>6.772,59</div>
              <div className="text-sm font-extrabold text-slate-700 mt-1">km²</div>
            </div>
            <div className="p-6 rounded-2xl bg-icegray border border-slate-200">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Tổng số đơn vị</span>
              <div className="text-4xl sm:text-5xl font-black font-display text-energy huge-num tabular-nums mt-2" data-countup>168</div>
              <div className="text-sm font-extrabold text-slate-700 mt-1">Đơn vị hành chính</div>
            </div>
          </div>
          {/* Biểu đồ thanh tỷ lệ phân bổ đơn vị hành chính */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-600 uppercase">Cơ cấu 168 đơn vị hành chính</span>
            </div>
            {/* Stacked bar */}
            <div className="h-6 w-full rounded-xl bg-slate-100 flex overflow-hidden p-1 gap-1" id="adminStackedBar">
              <div className="h-full rounded-lg bg-energy transition-all duration-1000 ease-out" id="barPhuong" style={{ width: "67.26%" }} title="113 Phường"></div>
              <div className="h-full rounded-lg bg-mint transition-all duration-1000 ease-out" id="barXa" style={{ width: "32.14%" }} title="54 Xã"></div>
              <div className="h-full rounded-lg bg-ice transition-all duration-1000 ease-out" id="barConDao" style={{ width: "0.6%" }} title="Đặc khu Côn Đảo"></div>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
              <div className="admin-unit-card p-2 rounded-xl bg-energy/10 border border-energy/30 cursor-pointer hover:bg-energy/20 transition-colors" data-bar="barPhuong">
                <div className="font-black text-energy text-base tabular-nums" data-countup>113</div>
                <div className="font-bold text-slate-700">Phường</div>
              </div>
              <div className="admin-unit-card p-2 rounded-xl bg-mint/10 border border-mint/30 cursor-pointer hover:bg-mint/20 transition-colors" data-bar="barXa">
                <div className="font-black text-mint text-base tabular-nums" data-countup>54</div>
                <div className="font-bold text-slate-700">Xã</div>
              </div>
              <div className="admin-unit-card p-2 rounded-xl bg-ice/10 border border-ice/30 cursor-pointer hover:bg-ice/20 transition-colors" data-bar="barConDao">
                <div className="font-black text-ice text-base tabular-nums" data-countup>01</div>
                <div className="font-bold text-slate-700">Đặc khu Côn Đảo</div>
              </div>
            </div>
          </div>
          <div className="text-slate-700 leading-relaxed space-y-4 text-base">
            <p>
              Sau sáp nhập, TPHCM bước vào quá trình tổ chức lại không gian phát triển trên quy mô chưa từng có, được xác định trong Quy hoạch tổng thể TPHCM thời kỳ 2025 - 2050, tầm nhìn 100 năm, vừa được UBND TPHCM phê duyệt.
            </p>
            <p>
              Thời kỳ quy hoạch tổng thể TPHCM là từ năm 2025 đến năm 2050; tầm nhìn chiến lược dài hạn 100 năm, hướng tới khoảng năm 2125 nhằm bảo đảm tính kế thừa, khả năng thích ứng và dư địa phát triển trước các biến động về kinh tế, công nghệ, dân số, biến đổi khí hậu và phương thức tổ chức không gian đô thị.
            </p>
          </div>
          {/* Khung Pull-Quote Tầm nhìn 100 năm */}
          <blockquote className="p-6 rounded-2xl bg-icegray border-l-4 border-cobalt shadow-sm">
            <div className="text-xs font-black uppercase text-cobalt tracking-wider mb-2">Tầm nhìn 100 năm</div>
            <p className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">Trở thành “Đô thị toàn cầu, thông minh, hiện đại, toàn diện, sánh ngang các đô thị hàng đầu thế giới”</p>
          </blockquote>
        </div>

        {/* Cột phải: Khối 2.2 - Bản đồ TPHCM & Ranh giới quy hoạch */}
        <div className="lg:col-span-6 bg-icegray rounded-3xl p-6 sm:p-8 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-black text-slate-900 font-display">Ranh giới quy hoạch</h3>
            </div>
          </div>
          {/* Compass Cardinal Layout */}
          <div className="space-y-4 pt-2">
            {/* Phía Bắc */}
            <div className="compass-dir p-4 rounded-2xl bg-white border-2 border-slate-200 hover:border-cobalt transition-all cursor-pointer shadow-sm text-center" data-dir="north" id="dirNorth">
              <span className="px-3 py-1 rounded-full bg-cobalt/10 text-cobalt text-xs font-black uppercase">Phía Bắc</span>
              <div className="text-base font-black text-slate-900 mt-1">giáp tỉnh Tây Ninh và thành phố Đồng Nai</div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Phía Tây */}
              <div className="compass-dir p-4 rounded-2xl bg-white border-2 border-slate-200 hover:border-energy transition-all cursor-pointer shadow-sm text-center" data-dir="west" id="dirWest">
                <span className="px-3 py-1 rounded-full bg-energy/10 text-energy text-xs font-black uppercase">Phía Tây</span>
                <div className="text-base font-black text-slate-900 mt-1">giáp tỉnh Tây Ninh và tỉnh Đồng Tháp</div>
              </div>
              {/* Phía Đông */}
              <div className="compass-dir p-4 rounded-2xl bg-white border-2 border-slate-200 hover:border-ice transition-all cursor-pointer shadow-sm text-center" data-dir="east" id="dirEast">
                <span className="px-3 py-1 rounded-full bg-ice/10 text-ice text-xs font-black uppercase">Phía Đông</span>
                <div className="text-base font-black text-slate-900 mt-1">giáp thành phố Đồng Nai và tỉnh Lâm Đồng</div>
              </div>
            </div>
            {/* Phía Nam */}
            <div className="compass-dir p-4 rounded-2xl bg-white border-2 border-slate-200 hover:border-mint transition-all cursor-pointer shadow-sm text-center" data-dir="south" id="dirSouth">
              <span className="px-3 py-1 rounded-full bg-mint/10 text-mint text-xs font-black uppercase">Phía Nam</span>
              <div className="text-base font-black text-slate-900 mt-1">giáp tỉnh Đồng Tháp và Biển Đông</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* ========================================== */}
    {/* PHẦN 3: ĐÔ THỊ 27 TRIỆU DÂN                */}
    {/* (NỀN XÁM BĂNG #F2F6FA — INTERACTIVE CHART) */}
    {/* ========================================== */}
    <section className="py-20 bg-white border-t border-slate-200 relative overflow-hidden" id="sec-part3">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header with HUGE 27 */}
        <div className="mb-12 flex flex-col items-center">
          <div aria-hidden="true" className="relative w-[72px] h-[72px] rounded-3xl bg-orange-50 border border-orange-200 shadow-sm flex items-center justify-center mb-3.5 anim-float">
            <span className="absolute inset-0 rounded-3xl border-2 border-energy/40 anim-pulse-ring"></span>
            <svg className="w-[42px] h-[42px]" fill="none" viewBox="0 0 24 24">
              <rect className="anim-bar text-cobalt" fill="currentColor" height="8" rx="1.2" style={{ animationDelay: "0s" }} width="3.5" x="4" y="12"></rect>
              <rect className="anim-bar text-energy" fill="currentColor" height="14" rx="1.2" style={{ animationDelay: "0.25s" }} width="4" x="10" y="6"></rect>
              <rect className="anim-bar text-ice" fill="currentColor" height="11" rx="1.2" style={{ animationDelay: "0.5s" }} width="3.5" x="16.5" y="9"></rect>
            </svg>
          </div>
          <div aria-hidden="true" className="w-28 sm:w-36 h-[3px] rounded-full mb-3 anim-divider" style={{ backgroundImage: "linear-gradient(90deg, transparent, #FF4D1C, #FFB800, #FF4D1C, transparent)" }}></div>
          <h2 className="text-3xl sm:text-4xl leading-tight font-black text-slate-900 font-display flex flex-wrap items-baseline justify-center gap-3 text-center">
            <span>Đô thị</span>
            <span className="text-4xl sm:text-5xl text-energy huge-num tabular-nums" data-countup>27</span>
            <span>triệu dân</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-8 items-start">
          <div className="w-full">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
              {/* Tab Buttons for quick manual control */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="text-sm font-black uppercase text-slate-800" id="chartPart3Title">Biểu đồ Dân số (triệu người)</div>
                <div className="flex gap-2">
                  <button className="part3-tab-btn px-3 py-1.5 rounded-xl text-xs font-black bg-energy text-white transition-all" data-layer="pop" id="btnTabPop" type="button">Dân số</button>
                  <button className="part3-tab-btn px-3 py-1.5 rounded-xl text-xs font-black bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all" data-layer="land" id="btnTabLand" type="button">Đất xây dựng</button>
                  <button className="part3-tab-btn px-3 py-1.5 rounded-xl text-xs font-black bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all" data-layer="labor" id="btnTabLabor" type="button">Lao động</button>
                </div>
              </div>
              {/* Canvas for Chart.js */}
              <div className="relative h-72 sm:h-80 w-full">
                <canvas id="part3ChartCanvas"></canvas>
              </div>
              {/* Exact Verbatim Data Table for Verification */}
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-center text-sm sm:text-base border-collapse bg-white font-sans">
                  <thead className="bg-slate-900 text-white font-bold">
                    <tr className="border-b border-slate-800">
                      <th className="p-3 sm:p-4 text-left font-bold border-r border-slate-800 w-1/4">Chỉ tiêu quy hoạch</th>
                      <th className="p-3 sm:p-4 font-bold border-r border-slate-800">Đến năm<br />2030</th>
                      <th className="p-3 sm:p-4 font-bold border-r border-slate-800">Đến năm<br />2035</th>
                      <th className="p-3 sm:p-4 font-bold border-r border-slate-800">Đến năm<br />2040</th>
                      <th className="p-3 sm:p-4 font-bold border-r border-slate-800">Đến năm<br />2045</th>
                      <th className="p-3 sm:p-4 font-bold bg-cobalt/80">Đến năm<br />2050</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800">
                    <tr className="hover:bg-slate-50 transition-colors cursor-pointer part3-row" data-layer="pop">
                      <td className="p-3 sm:p-4 font-bold text-slate-900 text-left bg-slate-50/50 border-r border-slate-200 leading-snug">Dân số (tạm trú, thường trú trên 6 tháng và dân số quy đổi)</td>
                      <td className="p-3 sm:p-4 font-bold text-energy border-r border-slate-200 leading-snug">Khoảng 18<br />triệu người</td>
                      <td className="p-3 sm:p-4 font-bold text-energy border-r border-slate-200 leading-snug">Khoảng 20,5<br />triệu người</td>
                      <td className="p-3 sm:p-4 font-bold text-energy border-r border-slate-200 leading-snug">Khoảng 23<br />triệu người</td>
                      <td className="p-3 sm:p-4 font-bold text-energy border-r border-slate-200 leading-snug">Khoảng 25<br />triệu người</td>
                      <td className="p-3 sm:p-4 font-black text-energy bg-energy/10 leading-snug">Khoảng 27<br />triệu người</td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition-colors cursor-pointer part3-row" data-layer="land">
                      <td className="p-3 sm:p-4 font-bold text-slate-900 text-left bg-slate-50/50 border-r border-slate-200 leading-snug">Quy mô đất xây dựng toàn thành phố</td>
                      <td className="p-3 sm:p-4 font-bold text-mint border-r border-slate-200 leading-snug">Khoảng<br />280.000-<br />290.000 ha</td>
                      <td className="p-3 sm:p-4 font-bold text-mint border-r border-slate-200 leading-snug">Khoảng<br />305.000-<br />315.000 ha</td>
                      <td className="p-3 sm:p-4 font-bold text-mint border-r border-slate-200 leading-snug">Khoảng<br />330.000-<br />345.000 ha</td>
                      <td className="p-3 sm:p-4 font-bold text-mint border-r border-slate-200 leading-snug">Khoảng<br />350.000-<br />362.000 ha</td>
                      <td className="p-3 sm:p-4 font-black text-mint bg-mint/10 leading-snug">Khoảng<br />365.000-<br />390.000 ha</td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition-colors cursor-pointer part3-row" data-layer="labor">
                      <td className="p-3 sm:p-4 font-bold text-slate-900 text-left bg-slate-50/50 border-r border-slate-200 leading-snug">Quy mô lao động</td>
                      <td className="p-3 sm:p-4 font-bold text-cobalt border-r border-slate-200 leading-snug">Khoảng 8,2<br />triệu người</td>
                      <td className="p-3 sm:p-4 text-slate-400 font-bold border-r border-slate-200 leading-snug">-</td>
                      <td className="p-3 sm:p-4 font-bold text-cobalt border-r border-slate-200 leading-snug">Khoảng 9,9<br />triệu người</td>
                      <td className="p-3 sm:p-4 font-bold text-cobalt border-r border-slate-200 leading-snug">Khoảng 10,7<br />triệu người</td>
                      <td className="p-3 sm:p-4 font-black text-cobalt bg-cobalt/10 leading-snug">Khoảng 11,3<br />triệu người</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* ========================================== */}
    {/* PHẦN 4: LỘ TRÌNH PHÁT TRIỂN                */}
    {/* (SCROLLYTELLING: 40% ẢNH STICKY, 60% NỘI DUNG) */}
    {/* ========================================== */}
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" id="sec-part4">
      <div className="mb-14 flex flex-col items-center">
        <div aria-hidden="true" className="relative w-[72px] h-[72px] rounded-3xl bg-sky-50 border border-sky-200 shadow-sm flex items-center justify-center mb-3.5 anim-float">
          <svg className="w-[42px] h-[42px] text-cobalt" fill="none" viewBox="0 0 24 24">
            <circle className="anim-orbit" cx="12" cy="12" r="9" stroke="currentColor" strokeDasharray="4 3" strokeWidth="1.8"></circle>
            <path d="M12 7v5l3.2 2" stroke="#FF4D1C" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2"></path>
            <circle cx="12" cy="12" fill="currentColor" r="1.5"></circle>
          </svg>
        </div>
        <div aria-hidden="true" className="w-28 sm:w-36 h-[3px] rounded-full mb-3 anim-divider" style={{ backgroundImage: "linear-gradient(90deg, transparent, #0057FF, #00C896, #0057FF, transparent)" }}></div>
        <h2 className="text-3xl sm:text-4xl leading-tight font-black text-slate-900 font-display text-center">
          Lộ trình phát triển
        </h2>
        <p className="text-slate-600 mt-2 max-w-4xl mx-auto text-center text-lg leading-relaxed">Phát triển TPHCM theo ba giai đoạn, thể hiện quá trình nâng tầm vị thế từ đô thị nổi trội của Đông Nam Á, trở thành trung tâm kinh tế, tài chính, văn hóa, xã hội, khoa học công nghệ và đổi mới sáng tạo của châu Á, trước khi vươn tới mục tiêu trở thành đô thị toàn cầu, thông minh, hiện đại, toàn diện, sánh ngang các đô thị hàng đầu thế giới trong dài hạn.</p>
      </div>
      {/* Scrollytelling Component: Trái 40% (Sticky Image Viewer), Phải 60% (Scroll Steps) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start relative">
        {/* Cột trái: 40% Sticky Image Stage */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 z-20">
          <div className="h-[380px] sm:h-[480px] lg:h-[540px] rounded-3xl overflow-hidden shadow-2xl relative border border-slate-200 bg-slate-900">
            {/* 3 Chồng Ảnh Tương Ứng 3 Mốc */}
            {/* Hình 1 (2030): Metro */}
            <div className="roadmap-img absolute inset-0 transition-opacity duration-700 ease-in-out pointer-events-none opacity-100" id="roadmapImg0">
              <img alt="Hạ tầng giao thông metro hiện đại kết nối đô thị Đông Nam Á" className="w-full h-full object-cover" src="/report-images/metro-anh-hoang-trieu-1.jpg" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30"></div>
            </div>
            {/* Hình 2 (2045): Skyline Landmark 81 bình minh */}
            <div className="roadmap-img absolute inset-0 transition-opacity duration-700 ease-in-out pointer-events-none opacity-0" id="roadmapImg1">
              <img alt="Đô thị TPHCM phát triển tầm vóc trung tâm tài chính châu Á" className="w-full h-full object-cover" src="/report-images/tp-hcm-anh-hoang-trieu.jpg" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30"></div>
            </div>
            {/* Hình 3 (2075+): Thành phố lung linh về đêm */}
            <div className="roadmap-img absolute inset-0 transition-opacity duration-700 ease-in-out pointer-events-none opacity-0" id="roadmapImg2">
              <img alt="Siêu đô thị TPHCM về đêm rực rỡ bên sông Sài Gòn" className="w-full h-full object-cover" src="/report-images/tphcm3.jpg" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/30"></div>
            </div>
          </div>
        </div>
        {/* Cột phải: 60% Nội dung cuộn đổi hình */}
        <div className="lg:col-span-7 space-y-24 sm:space-y-32 py-2">
          {/* Mốc 1: 2030 */}
          <div className="roadmap-step relative group cursor-pointer active" data-step="0" id="roadmapStep0">
            <div className="p-6 sm:p-9 rounded-3xl bg-icegray border-2 transition-all duration-300 shadow-md border-sun">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <span className="px-3.5 py-1.5 rounded-full bg-sun/20 text-slate-900 border border-sun/40 text-xs font-black uppercase tracking-wider">
                  Đến năm 2030</span>
                <span className="text-4xl sm:text-5xl font-black font-display text-slate-900 huge-num tabular-nums" data-countup>2030</span>
              </div>
              <p className="text-slate-800 leading-relaxed font-medium text-base sm:text-lg">
                Là đô thị đặc biệt, văn minh, hiện đại, năng động, sáng tạo; trung tâm kinh tế, tài chính, văn hóa, xã hội, KH-CN, logistics và hội nhập quốc tế; có vị trí nổi trội trong khu vực Đông Nam Á.
              </p>
            </div>
          </div>
          {/* Mốc 2: 2045 */}
          <div className="roadmap-step relative group cursor-pointer" data-step="1" id="roadmapStep1">
            <div className="p-6 sm:p-9 rounded-3xl bg-icegray border-2 hover:border-mint transition-all duration-300 border-transparent">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <span className="px-3.5 py-1.5 rounded-full bg-mint/20 border border-mint/40 text-xs font-black uppercase tracking-wider text-emerald-800">
                  Đến năm 2045</span>
                <span className="text-4xl sm:text-5xl font-black font-display text-slate-900 huge-num tabular-nums" data-countup>2045</span>
              </div>
              <p className="text-slate-800 leading-relaxed font-medium text-base sm:text-lg">
                Trở thành trung tâm kinh tế, tài chính quốc tế, văn hóa, xã hội, KH-CN và đổi mới sáng tạo của châu Á; tăng trưởng xanh, phát triển bền vững, thích ứng biến đổi khí hậu; điểm đến hấp dẫn toàn cầu, có đời sống văn hóa - xã hội đặc sắc, chất lượng sống cao.
              </p>
            </div>
          </div>
          {/* Mốc 3: 2075 và xa hơn */}
          <div className="roadmap-step relative group cursor-pointer" data-step="2" id="roadmapStep2">
            <div className="p-6 sm:p-9 rounded-3xl bg-orange-50 border-2 border-transparent hover:border-orange-500 transition-all duration-300 shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <span className="px-3.5 py-1.5 rounded-full bg-orange-100 text-orange-700 border border-orange-300 text-xs font-black uppercase tracking-wider">
                  Đến năm 2075 và xa hơn</span>
                <span className="text-4xl sm:text-5xl font-black font-display text-orange-600 huge-num tabular-nums" data-countup>2075+</span>
              </div>
              <p className="text-slate-800 leading-relaxed font-medium text-base sm:text-lg">
                Trở thành đô thị toàn cầu, thông minh, hiện đại, phát triển toàn diện, ngang tầm các đô thị phát triển hàng đầu thế giới; là trung tâm kinh tế, tài chính, khoa học, công nghệ, đổi mới sáng tạo có sức hấp dẫn cao đối với nhân tài, doanh nghiệp và các nguồn lực phát triển.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* ========================================== */}
    {/* PHẦN 5: GRDP BÌNH QUÂN ĐẦU NGƯỜI TĂNG GẦN  */}
    {/* 7 LẦN TỪ 2030 ĐẾN 2075 (SCROLLYTELLING)   */}
    {/* ========================================== */}
    <section className="py-20 bg-gradient-to-br from-cobalt via-ice to-cobalt text-white border-t border-cobalt/30 relative overflow-hidden" id="sec-part5">
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-energy/20 blur-3xl pointer-events-none"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-12 flex flex-col items-center">
          <div aria-hidden="true" className="relative w-[72px] h-[72px] rounded-3xl bg-white/15 backdrop-blur-sm border border-white/30 shadow-md flex items-center justify-center mb-3.5 anim-float">
            <svg className="w-[42px] h-[42px]" fill="none" viewBox="0 0 24 24">
              <rect className="anim-bar text-white/80" fill="currentColor" height="6" rx="1" style={{ animationDelay: "0s" }} width="3.5" x="4" y="14"></rect>
              <rect className="anim-bar text-sun" fill="currentColor" height="10" rx="1" style={{ animationDelay: "0.25s" }} width="3.5" x="10.25" y="10"></rect>
              <rect className="anim-bar text-sun" fill="currentColor" height="14" rx="1" style={{ animationDelay: "0.5s" }} width="3.5" x="16.5" y="6"></rect>
              <path d="M4 10l6-4 4 2 6-5" stroke="#FFB800" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
            </svg>
          </div>
          <div aria-hidden="true" className="w-28 sm:w-36 h-[3px] rounded-full mb-3 anim-divider" style={{ backgroundImage: "linear-gradient(90deg, transparent, #FFB800, #FFFFFF, #FFB800, transparent)" }}></div>
          <h2 className="text-3xl sm:text-4xl leading-tight font-black font-display text-white drop-shadow-sm text-center">GRDP bình quân đầu người tăng <span className="text-sun font-black drop-shadow-md">gần 7 lần</span> từ năm 2030 đến 2075</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 space-y-6 pb-6">
            <div className="grdp-stage-card p-6 rounded-2xl bg-white/10 backdrop-blur-md border-2 border-white/20 hover:border-white transition-all cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-0.5" data-stage="0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-3xl font-black font-display text-white">2030</span>
              </div>
              <div className="text-sm text-slate-100 space-y-1.5">
                <div>Tăng trưởng GRDP bình quân đạt tối thiểu: <strong className="text-white font-black tabular-nums" data-countup>10,5%/năm</strong></div>
                <div>GRDP đạt khoảng: <strong className="text-white font-black tabular-nums" data-countup>200 - 225 tỷ USD</strong></div>
                <div>GRDP bình quân đầu người đạt tối thiểu: <strong className="text-sun font-black text-base tabular-nums" data-countup>14.500 USD</strong></div>
              </div>
            </div>
            <div className="grdp-stage-card p-6 rounded-2xl bg-white/10 backdrop-blur-md border-2 border-white/20 hover:border-mint transition-all cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-0.5" data-stage="1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-3xl font-black font-display text-white">2035</span>
              </div>
              <div className="text-sm text-slate-100 space-y-1.5">
                <div>Tăng trưởng GRDP bình quân đạt tối thiểu: <strong className="text-white font-black tabular-nums" data-countup>10%/năm</strong></div>
                <div>GRDP đạt khoảng: <strong className="text-white font-black tabular-nums" data-countup>400 - 450 tỷ USD</strong></div>
                <div>GRDP bình quân đầu người đạt tối thiểu: <strong className="text-mint font-black text-base tabular-nums" data-countup>25.000 USD</strong></div>
              </div>
            </div>
            <div className="grdp-stage-card p-6 rounded-2xl bg-white/10 backdrop-blur-md border-2 border-white/20 hover:border-ice transition-all cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-0.5" data-stage="2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-3xl font-black font-display text-white">2045</span>
              </div>
              <div className="text-sm text-slate-100 space-y-1.5">
                <div>Tăng trưởng GRDP bình quân đạt tối thiểu: <strong className="text-white font-black tabular-nums" data-countup>10%/năm</strong></div>
                <div>GRDP đạt khoảng: <strong className="text-white font-black tabular-nums" data-countup>1.300 - 1.700 tỷ USD</strong></div>
                <div>GRDP bình quân đầu người đạt tối thiểu: <strong className="text-white font-black text-base tabular-nums" data-countup>75.000 USD</strong></div>
              </div>
            </div>
            <div className="grdp-stage-card p-6 rounded-2xl bg-gradient-to-r from-energy/30 to-sun/30 backdrop-blur-md border-2 border-sun hover:border-white transition-all cursor-pointer shadow-xl shadow-energy/20 hover:-translate-y-0.5 ring-2 ring-sun/60" data-stage="3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-3xl font-black font-display text-sun drop-shadow-sm">2075 và xa hơn</span>
              </div>
              <div className="text-sm text-white space-y-1.5">
                <div>Tăng trưởng GRDP bình quân giai đoạn 2046 - 2075 đạt tối thiểu: <strong className="text-white font-black tabular-nums" data-countup>6%/năm</strong></div>
                <div>GRDP bình quân đầu người đạt tối thiểu: <strong className="text-sun font-black text-lg tabular-nums" data-countup>100.000 USD</strong> (tăng gần 7 lần so với 2030)</div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-7 lg:sticky lg:top-14">
            <div className="rounded-3xl p-6 sm:p-8 bg-white border border-slate-200 shadow-xl space-y-6 transition-all text-slate-900" id="grdpStageContainer">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="text-sm font-black uppercase tracking-wider text-slate-500">Chỉ số kinh tế trọng điểm <span className="text-cobalt font-display text-base ml-1 font-black" id="grdpYearLabel">Năm 2075+</span></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm">
                  <span className="text-xs font-bold text-slate-500 uppercase">Tăng trưởng GRDP</span>
                  <div className="text-3xl sm:text-4xl font-black font-display text-cobalt tabular-nums mt-1" id="grdpGrowthVal" data-countup>≥ 6%/năm</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm">
                  <span className="text-xs font-bold text-slate-500 uppercase">Quy mô GRDP</span>
                  <div className="text-3xl sm:text-4xl font-black font-display text-ice tabular-nums mt-1" id="grdpTotalVal" data-countup></div>
                </div>
                <div className="p-4 rounded-2xl bg-orange-50 border-2 border-sun shadow-sm">
                  <span className="text-xs font-bold text-orange-700 uppercase">Đầu người (Tối thiểu)</span>
                  <div className="text-4xl sm:text-5xl font-black font-display text-energy tabular-nums mt-1" id="grdpPerCapitaVal" data-countup>100.000 USD</div>
                </div>
              </div>
              <div className="h-60 sm:h-64 w-full bg-slate-50/50 p-2 rounded-2xl border border-slate-100">
                <canvas id="grdpChartCanvas"></canvas>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* ========================================== */}
    {/* PHẦN 6: ĐÔ THỊ ĐA CỰC, ĐA TRUNG TÂM       */}
    {/* (NỀN TRẮNG LƯỚI CHẤM #CBD5E1)              */}
    {/* ========================================== */}
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-dot-grid" id="sec-part6">
      <div className="mb-10 flex flex-col items-center">
        <div aria-hidden="true" className="relative w-[72px] h-[72px] rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center justify-center mb-3.5 anim-float">
          <svg className="w-[42px] h-[42px]" fill="none" viewBox="0 0 24 24">
            <g className="anim-orbit">
              <line stroke="#94A3B8" strokeWidth="1.5" x1="12" x2="12" y1="12" y2="4.5"></line>
              <line stroke="#94A3B8" strokeWidth="1.5" x1="12" x2="18.5" y1="12" y2="16"></line>
              <line stroke="#94A3B8" strokeWidth="1.5" x1="12" x2="5.5" y1="12" y2="16"></line>
              <circle cx="12" cy="4.5" fill="#FF4D1C" r="2.2"></circle>
              <circle cx="18.5" cy="16" fill="#00C896" r="2.2"></circle>
              <circle cx="5.5" cy="16" fill="#FFB800" r="2.2"></circle>
            </g>
            <circle cx="12" cy="12" fill="#0057FF" r="2.8"></circle>
          </svg>
        </div>
        <div aria-hidden="true" className="w-28 sm:w-36 h-[3px] rounded-full mb-3 anim-divider" style={{ backgroundImage: "linear-gradient(90deg, transparent, #0057FF, #00C896, #FFB800, transparent)" }}></div>
        <h2 className="text-3xl sm:text-4xl leading-tight font-black text-slate-900 font-display text-center">
          Đô thị đa cực, đa trung tâm
        </h2>
        <p className="text-slate-700 mt-3 max-w-4xl mx-auto text-center text-lg leading-relaxed">Thành phố phát triển theo mô hình “siêu đô thị đa cực, đa trung tâm”, chuyển từ cấu trúc cộng gộp sang mạng lưới đô thị thống nhất, liên kết và chuyên môn hóa theo lợi thế. Để quản trị hiệu quả trên địa bàn rộng lớn, quy hoạch chia thành phố thành 10 vùng quản trị phát triển dựa trên đặc thù và mật độ dân số.</p>
      </div>
      {/* Thanh Điều hướng Click Liên kết (Anchor Bar) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
        <a className="p-5 rounded-2xl bg-white border-2 border-energy hover:shadow-lg hover:shadow-energy/10 transition-all flex items-center justify-between group" href="#sub-5cuc">
          <div>
            <div className="text-base font-bold text-slate-800">5 Cực động lực phát triển</div>
          </div>
          <div className="text-5xl font-black font-display text-energy huge-num tabular-nums" data-countup>5</div>
        </a>
        <a className="p-5 rounded-2xl bg-white border-2 border-mint hover:shadow-lg hover:shadow-mint/10 transition-all flex items-center justify-between group" href="#sub-5vetinh">
          <div>
            <div className="text-base font-bold text-slate-800">5 Trung tâm vệ tinh</div>
          </div>
          <div className="text-5xl font-black font-display text-mint huge-num tabular-nums" data-countup>5</div>
        </a>
        <a className="p-5 rounded-2xl bg-white border-2 border-sun hover:shadow-lg hover:shadow-sun/15 transition-all flex items-center justify-between group" href="#sub-10vung">
          <div>
            <div className="text-base font-bold text-slate-800">10 Vùng quản trị phát triển</div>
          </div>
          <div className="text-5xl font-black font-display text-sun huge-num tabular-nums" data-countup>10</div>
        </a>
      </div>

      {/* Mục 6.1 - 5 Cực động lực phát triển */}
      <div className="mb-16 pt-6" id="sub-5cuc">
        <div className="flex items-center gap-3 mb-6">
          <span className="w-3 h-3 rounded-full bg-energy"></span>
          <h3 className="text-2xl font-black text-slate-900 font-display">5 Cực động lực phát triển:</h3>
        </div>
        <div className="w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Cực 1: Cực lõi trung tâm */}
            <div className="flip-card group h-[380px] cursor-pointer">
              <div className="flip-card-inner shadow-md hover:shadow-2xl rounded-3xl">
                {/* Front Side */}
                <div className="flip-card-front rounded-3xl overflow-hidden border border-slate-200 bg-slate-900 flex flex-col justify-end p-6 text-white">
                  <img alt="Cực lõi trung tâm: Sài Gòn - Chợ Lớn - Thủ Thiêm" className="absolute inset-0 w-full h-full object-cover" src="/report-images/tphcm-1.jpg" title="Cực lõi trung tâm: Sài Gòn - Chợ Lớn - Thủ Thiêm" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-black/30"></div>
                  <div className="relative z-10 space-y-3">
                    <h4 className="text-2xl font-black font-display text-white leading-tight drop-shadow-md">Cực lõi trung tâm: Sài Gòn - Chợ Lớn - Thủ Thiêm</h4>
                    <div className="inline-flex items-center gap-2 bg-slate-900 hover:bg-sky-600 text-white font-bold text-sm rounded-xl px-3 py-1.5 transition-all shadow-sm">
                      <span>Lật xem</span>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path></svg>
                    </div>
                  </div>
                </div>
                {/* Back Side */}
                <div className="flip-card-back rounded-3xl border-2 border-sun bg-white p-6 flex flex-col justify-between text-slate-900 overflow-hidden">
                  <div className="space-y-3 overflow-y-auto pr-1">
                    <h4 className="text-xl font-black font-display text-slate-900 leading-snug">Cực lõi trung tâm</h4>
                    <p className="text-base text-slate-600 leading-relaxed">
                      Tập trung tại Sài Gòn - Chợ Lớn - Thủ Thiêm, là trung tâm tài chính quốc tế, quản trị, thương mại, dịch vụ, du lịch, văn hóa, công viên chuyên đề tầm cỡ quốc tế và kinh tế sáng tạo; ưu tiên tái thiết, bảo tồn di sản.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cực 2: Cực đổi mới sáng tạo */}
            <div className="flip-card group h-[380px] cursor-pointer">
              <div className="flip-card-inner shadow-md hover:shadow-2xl rounded-3xl">
                {/* Front Side */}
                <div className="flip-card-front rounded-3xl overflow-hidden border border-slate-200 bg-slate-900 flex flex-col justify-end p-6 text-white">
                  <img alt="Sân bay Long Thành và cực đổi mới sáng tạo phía Đông" className="absolute inset-0 w-full h-full object-cover" src="/report-images/san-bay-long-thanh.jpg" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-black/30"></div>
                  <div className="relative z-10 space-y-3">
                    <h4 className="text-2xl font-black font-display text-white leading-tight drop-shadow-md">Cực đổi mới sáng tạo phía Đông, Đông Bắc</h4>
                    <div className="inline-flex items-center gap-2 bg-slate-900 hover:bg-sky-600 text-white font-bold text-sm rounded-xl px-3 py-1.5 transition-all shadow-sm">
                      <span>Lật xem</span>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path></svg>
                    </div>
                  </div>
                </div>
                {/* Back Side */}
                <div className="flip-card-back rounded-3xl border-2 border-cobalt bg-white p-6 flex flex-col justify-between text-slate-900 overflow-hidden">
                  <div className="space-y-3 overflow-y-auto pr-1">
                    <h4 className="text-xl font-black font-display text-slate-900 leading-snug">Cực đổi mới sáng tạo phía Đông, Đông Bắc</h4>
                    <p className="text-base text-slate-600 leading-relaxed">
                      Kết nối Thủ Đức, Dĩ An, Thuận An, Bình Dương, Tân Uyên với sân bay Long Thành, tập trung công nghệ cao, AI, bán dẫn và giáo dục đại học.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cực 3: Cực công nghiệp - logistics */}
            <div className="flip-card group h-[380px] cursor-pointer">
              <div className="flip-card-inner shadow-md hover:shadow-2xl rounded-3xl">
                {/* Front Side */}
                <div className="flip-card-front rounded-3xl overflow-hidden border border-slate-200 bg-slate-900 flex flex-col justify-end p-6 text-white">
                  <img alt="Bàu Bàng - Cực công nghiệp logistics phía Bắc" className="absolute inset-0 w-full h-full object-cover" src="/report-images/bau-bang.jpg" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-black/30"></div>
                  <div className="relative z-10 space-y-3">
                    <h4 className="text-2xl font-black font-display text-white leading-tight drop-shadow-md">Cực công nghiệp - logistics phía Bắc</h4>
                    <div className="inline-flex items-center gap-2 bg-slate-900 hover:bg-sky-600 text-white font-bold text-sm rounded-xl px-3 py-1.5 transition-all shadow-sm">
                      <span>Lật xem</span>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path></svg>
                    </div>
                  </div>
                </div>
                {/* Back Side */}
                <div className="flip-card-back rounded-3xl border-2 border-energy bg-white p-6 flex flex-col justify-between text-slate-900 overflow-hidden">
                  <div className="space-y-3 overflow-y-auto pr-1">
                    <h4 className="text-xl font-black font-display text-slate-900 leading-snug">Cực công nghiệp - logistics phía Bắc</h4>
                    <p className="text-base text-slate-600 leading-relaxed">
                      Phát triển tại Bến Cát, Bàu Bàng và vùng phụ cận, chuyển các KCN đơn chức năng thành hệ sinh thái công nghiệp, logistics, đô thị và dịch vụ thế hệ mới.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cực 4: Cực cảng biển - thương mại tự do */}
            <div className="flip-card group h-[380px] cursor-pointer">
              <div className="flip-card-inner shadow-md hover:shadow-2xl rounded-3xl">
                {/* Front Side */}
                <div className="flip-card-front rounded-3xl overflow-hidden border border-slate-200 bg-slate-900 flex flex-col justify-end p-6 text-white">
                  <img alt="Vũng Tàu - Cần Giờ - Cực kinh tế biển phía Nam" className="absolute inset-0 w-full h-full object-cover" src="/report-images/vung-tau.jpg" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-black/30"></div>
                  <div className="relative z-10 space-y-3">
                    <h4 className="text-2xl font-black font-display text-white leading-tight drop-shadow-md">Cực cảng biển - thương mại tự do - công nghiệp năng lượng phía Nam</h4>
                    <div className="inline-flex items-center gap-2 bg-slate-900 hover:bg-sky-600 text-white font-bold text-sm rounded-xl px-3 py-1.5 transition-all shadow-sm">
                      <span>Lật xem</span>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path></svg>
                    </div>
                  </div>
                </div>
                {/* Back Side */}
                <div className="flip-card-back rounded-3xl border-2 border-ice bg-white p-6 flex flex-col justify-between text-slate-900 overflow-hidden">
                  <div className="space-y-3 overflow-y-auto pr-1">
                    <h4 className="text-xl font-black font-display text-slate-900 leading-snug">Cực cảng biển - thương mại tự do - công nghiệp năng lượng phía Nam</h4>
                    <p className="text-base text-slate-600 leading-relaxed">
                      Kết nối Châu Đức, Long Sơn, Phú Mỹ, Vũng Tàu và Cần Giờ, phát huy thế mạnh cảng biển, logistics, hàng hải, thương mại tự do và năng lượng sạch.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cực 5: Cực đô thị, giáo dục, y tế */}
            <div className="flip-card group h-[380px] cursor-pointer sm:col-span-2 lg:col-span-1">
              <div className="flip-card-inner shadow-md hover:shadow-2xl rounded-3xl">
                {/* Front Side */}
                <div className="flip-card-front rounded-3xl overflow-hidden border border-slate-200 bg-slate-900 flex flex-col justify-end p-6 text-white">
                  <img alt="Trung tâm y tế chuyên sâu, giáo dục phía Tây" className="absolute inset-0 w-full h-full object-cover" src="/report-images/y-te.jpg" title="Cực đô thị, giáo dục, y tế phía Tây" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-black/30"></div>
                  <div className="relative z-10 space-y-3">
                    <h4 className="text-2xl font-black font-display text-white leading-tight drop-shadow-md">Cực đô thị, giáo dục, y tế phía Tây</h4>
                    <div className="inline-flex items-center gap-2 bg-slate-900 hover:bg-sky-600 text-white font-bold text-sm rounded-xl px-3 py-1.5 transition-all shadow-sm">
                      <span>Lật xem</span>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path></svg>
                    </div>
                  </div>
                </div>
                {/* Back Side */}
                <div className="flip-card-back rounded-3xl border-2 border-mint bg-white p-6 flex flex-col justify-between text-slate-900 overflow-hidden">
                  <div className="space-y-3 overflow-y-auto pr-1">
                    <h4 className="text-xl font-black font-display text-slate-900 leading-snug">Cực đô thị, giáo dục, y tế phía Tây</h4>
                    <p className="text-base text-slate-600 leading-relaxed">
                      Phát triển các khu đô thị đồng bộ, trung tâm đào tạo và y tế chuyên sâu, triển lãm và dịch vụ cao cấp, giảm áp lực hạ tầng cho khu vực lõi thành phố.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mục 6.2 - 5 Trung tâm vệ tinh */}
      <div className="mb-16 pt-6 border-t border-slate-200" id="sub-5vetinh">
        <div className="flex items-center gap-3 mb-6">
          <span className="w-3 h-3 rounded-full bg-mint"></span>
          <h3 className="text-2xl font-black text-slate-900 font-display">5 Trung tâm vệ tinh:</h3>
        </div>
        <div className="relative w-full overflow-hidden py-6" id="satelliteCarouselContainer">
          <div className="relative w-full max-w-5xl mx-auto h-[480px] sm:h-[500px] flex items-center justify-center">
            <div className="satellite-card absolute transition-all duration-500 ease-in-out cursor-pointer w-[300px] sm:w-[380px] bg-white rounded-3xl p-5 sm:p-6 border-2 border-mint shadow-2xl z-20 scale-100 opacity-100 -translate-x-0 pointer-events-auto" data-index="0">
              <div className="relative w-full h-52 sm:h-56 rounded-2xl overflow-hidden mb-4 shadow-sm">
                <img alt="Côn Đảo" className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" src="/report-images/con-dao.jpg" />
              </div>
              <div className="space-y-2">
                <h4 className="text-2xl font-black font-display text-slate-900">Côn Đảo</h4>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">Du lịch sinh thái biển đảo, di sản, nghiên cứu khoa học gắn với bảo tồn thiên nhiên…</p>
              </div>
            </div>
            <div className="satellite-card absolute transition-all duration-500 ease-in-out cursor-pointer w-[300px] sm:w-[380px] bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-lg z-10 scale-90 opacity-60 translate-x-[70%] sm:translate-x-[65%] pointer-events-auto" data-index="1">
              <div className="relative w-full h-52 sm:h-56 rounded-2xl overflow-hidden mb-4 shadow-sm">
                <img alt="Vũng Tàu - Long Hải - Hồ Tràm" className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" src="/report-images/long-hai.jpg" />
              </div>
              <div className="space-y-2">
                <h4 className="text-2xl font-black font-display text-slate-900">Vũng Tàu - Long Hải - Hồ Tràm</h4>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">du lịch nghỉ dưỡng, dịch vụ biển, thể thao và chăm sóc sức khỏe…</p>
              </div>
            </div>
            <div className="satellite-card absolute transition-all duration-500 ease-in-out cursor-pointer w-[300px] sm:w-[380px] bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-md z-0 scale-75 opacity-0 translate-x-[110%] pointer-events-none" data-index="2">
              <div className="relative w-full h-52 sm:h-56 rounded-2xl overflow-hidden mb-4 shadow-sm">
                <img alt="Hóc Môn - Củ Chi" className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" src="/report-images/hoc-mon.jpg" />
              </div>
              <div className="space-y-2">
                <h4 className="text-2xl font-black font-display text-slate-900">Hóc Môn - Củ Chi</h4>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">đô thị sinh thái, công nghệ sinh học, nông nghiệp công nghệ cao và du lịch văn hóa - lịch sử</p>
              </div>
            </div>
            <div className="satellite-card absolute transition-all duration-500 ease-in-out cursor-pointer w-[300px] sm:w-[380px] bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-md z-0 scale-75 opacity-0 -translate-x-[110%] pointer-events-none" data-index="3">
              <div className="relative w-full h-52 sm:h-56 rounded-2xl overflow-hidden mb-4 shadow-sm">
                <img alt="Bàu Bàng" className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" src="/report-images/bau-bang-2.jpg" />
              </div>
              <div className="space-y-2">
                <h4 className="text-2xl font-black font-display text-slate-900">Bàu Bàng</h4>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">công nghiệp công nghệ cao, logistics và đô thị công nghiệp thế hệ mới</p>
              </div>
            </div>
            <div className="satellite-card absolute transition-all duration-500 ease-in-out cursor-pointer w-[300px] sm:w-[380px] bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-lg z-10 scale-90 opacity-60 -translate-x-[70%] sm:-translate-x-[65%] pointer-events-auto" data-index="4">
              <div className="relative w-full h-52 sm:h-56 rounded-2xl overflow-hidden mb-4 shadow-sm">
                <img alt="Tân Uyên - Bắc Tân Uyên" className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" src="/report-images/tan-uyen.jpg" />
              </div>
              <div className="space-y-2">
                <h4 className="text-2xl font-black font-display text-slate-900">Tân Uyên - Bắc Tân Uyên</h4>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">dịch vụ công nghiệp, logistics, đô thị đại học, đô thị sinh thái dọc Vành đai 4 và ven sông Đồng Nai.</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-6 mt-4">
            <button aria-label="Vệ tinh trước" className="w-11 h-11 rounded-full border-2 border-slate-200 bg-white hover:border-mint hover:bg-mint/10 text-slate-700 hover:text-mint flex items-center justify-center shadow-md transition-all" id="satPrevBtn" type="button">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path></svg>
            </button>
            <div className="flex items-center gap-3">
              <span className="text-sm font-black font-display text-slate-800 tracking-wider" id="satPageIndicator">1 / 5</span>
              <div className="flex items-center gap-1.5" id="satDotsContainer">
                <button aria-label="Vệ tinh 1" className="w-3 h-2.5 rounded-full bg-mint transition-all sat-dot" data-index="0" type="button"></button>
                <button aria-label="Vệ tinh 2" className="w-2 h-2 rounded-full bg-slate-300 transition-all sat-dot" data-index="1" type="button"></button>
                <button aria-label="Vệ tinh 3" className="w-2 h-2 rounded-full bg-slate-300 transition-all sat-dot" data-index="2" type="button"></button>
                <button aria-label="Vệ tinh 4" className="w-2 h-2 rounded-full bg-slate-300 transition-all sat-dot" data-index="3" type="button"></button>
                <button aria-label="Vệ tinh 5" className="w-2 h-2 rounded-full bg-slate-300 transition-all sat-dot" data-index="4" type="button"></button>
              </div>
            </div>
            <button aria-label="Vệ tinh tiếp theo" className="w-11 h-11 rounded-full border-2 border-slate-200 bg-white hover:border-mint hover:bg-mint/10 text-slate-700 hover:text-mint flex items-center justify-center shadow-md transition-all" id="satNextBtn" type="button">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mục 6.3 - Hạt nhân Chiến lược & 10 Vùng quản trị phát triển */}
      <div className="pt-6 border-t border-slate-200" id="sub-10vung">
        {/* 2 Hạt nhân Chiến lược */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="p-6 rounded-2xl bg-cobalt text-white shadow-md">
            <h4 className="text-xl font-black mt-2 mb-1">Thủ Thiêm - An Khánh:</h4>
            <p className="text-sm text-slate-100 leading-relaxed">
              Trung tâm chính trị - hành chính Thành phố phù hợp với định hướng tại khu vực Thủ Thiêm - An Khánh, bảo đảm thống nhất với vai trò của cực lõi trung tâm quản trị, tài chính và dịch vụ quốc tế.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-energy text-white shadow-md">
            <h4 className="text-xl font-black mt-2 mb-1">Rạch Chiếc:</h4>
            <p className="text-sm text-slate-100 leading-relaxed">
              Phát huy vai trò Rạch Chiếc là trung tâm đô thị thể thao, văn hóa, sáng tạo và giải trí phức hợp tầm cỡ quốc tế.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 sm:gap-3 mb-4 sm:mb-6">
          <span className="w-3 h-3 rounded-full bg-sun shrink-0"></span>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-display">10 vùng quản trị phát triển:</h3>
        </div>
        {/* Trình bày thẻ trên cùng + Thanh mốc 1-10 + Nút qua trái/phải */}
        <div className="space-y-5 sm:space-y-6" id="zonesCarouselWrapper" tabIndex={0}>
          {/* Dòng line phía trên với các mốc từ 1 đến 10 */}
          <div className="relative max-w-4xl mx-auto px-1 sm:px-4 pt-1">
            <div className="relative flex items-center justify-between">
              <div className="absolute left-3.5 right-3.5 sm:left-5 sm:right-5 top-1/2 -translate-y-1/2 h-[3px] bg-slate-200 rounded-full z-0 overflow-hidden">
                <div className="h-full bg-sun rounded-full transition-all duration-300" id="zoneTimelineProgress" style={{ width: "0%" }}></div>
              </div>
              <button aria-label="Vùng 1" className="zone-milestone relative z-10 w-7 h-7 sm:w-10 sm:h-10 rounded-full border-2 border-amber-500 bg-sun text-slate-950 text-xs sm:text-sm font-black font-display flex items-center justify-center shadow-md ring-4 ring-sun/25 scale-110 transition-all cursor-pointer" data-zone-dot="0" title="1. Vùng lõi đô thị - tài chính - quản trị - di sản" type="button">1</button>
              <button aria-label="Vùng 2" className="zone-milestone relative z-10 w-7 h-7 sm:w-10 sm:h-10 rounded-full border-2 border-slate-300 bg-white text-slate-600 hover:border-sun hover:text-amber-700 text-xs sm:text-sm font-bold font-display flex items-center justify-center transition-all cursor-pointer" data-zone-dot="1" title="2. Vùng đổi mới sáng tạo phía Đông" type="button">2</button>
              <button aria-label="Vùng 3" className="zone-milestone relative z-10 w-7 h-7 sm:w-10 sm:h-10 rounded-full border-2 border-slate-300 bg-white text-slate-600 hover:border-sun hover:text-amber-700 text-xs sm:text-sm font-bold font-display flex items-center justify-center transition-all cursor-pointer" data-zone-dot="2" title="3. Vùng Tây - Tây Nam" type="button">3</button>
              <button aria-label="Vùng 4" className="zone-milestone relative z-10 w-7 h-7 sm:w-10 sm:h-10 rounded-full border-2 border-slate-300 bg-white text-slate-600 hover:border-sun hover:text-amber-700 text-xs sm:text-sm font-bold font-display flex items-center justify-center transition-all cursor-pointer" data-zone-dot="3" title="4. Vùng đô thị công nghiệp - dịch vụ phía Bắc" type="button">4</button>
              <button aria-label="Vùng 5" className="zone-milestone relative z-10 w-7 h-7 sm:w-10 sm:h-10 rounded-full border-2 border-slate-300 bg-white text-slate-600 hover:border-sun hover:text-amber-700 text-xs sm:text-sm font-bold font-display flex items-center justify-center transition-all cursor-pointer" data-zone-dot="4" title="5. Vùng sinh thái và dự trữ phát triển" type="button">5</button>
              <button aria-label="Vùng 6" className="zone-milestone relative z-10 w-7 h-7 sm:w-10 sm:h-10 rounded-full border-2 border-slate-300 bg-white text-slate-600 hover:border-sun hover:text-amber-700 text-xs sm:text-sm font-bold font-display flex items-center justify-center transition-all cursor-pointer" data-zone-dot="5" title="6. Vùng phía Tây Bắc và phía Nam" type="button">6</button>
              <button aria-label="Vùng 7" className="zone-milestone relative z-10 w-7 h-7 sm:w-10 sm:h-10 rounded-full border-2 border-slate-300 bg-white text-slate-600 hover:border-sun hover:text-amber-700 text-xs sm:text-sm font-bold font-display flex items-center justify-center transition-all cursor-pointer" data-zone-dot="6" title="7. Vùng sinh thái biển Cần Giờ" type="button">7</button>
              <button aria-label="Vùng 8" className="zone-milestone relative z-10 w-7 h-7 sm:w-10 sm:h-10 rounded-full border-2 border-slate-300 bg-white text-slate-600 hover:border-sun hover:text-amber-700 text-xs sm:text-sm font-bold font-display flex items-center justify-center transition-all cursor-pointer" data-zone-dot="7" title="8. Vùng cảng biển - logistics - công nghiệp - năng lượng" type="button">8</button>
              <button aria-label="Vùng 9" className="zone-milestone relative z-10 w-7 h-7 sm:w-10 sm:h-10 rounded-full border-2 border-slate-300 bg-white text-slate-600 hover:border-sun hover:text-amber-700 text-xs sm:text-sm font-bold font-display flex items-center justify-center transition-all cursor-pointer" data-zone-dot="8" title="9. Vùng du lịch biển Vũng Tàu - Long Hải - Hồ Tràm - Bình Châu" type="button">9</button>
              <button aria-label="Vùng 10" className="zone-milestone relative z-10 w-7 h-7 sm:w-10 sm:h-10 rounded-full border-2 border-slate-300 bg-white text-slate-600 hover:border-sun hover:text-amber-700 text-xs sm:text-sm font-bold font-display flex items-center justify-center transition-all cursor-pointer" data-zone-dot="9" title="10. Đặc khu Côn Đảo" type="button">10</button>
            </div>
          </div>

          {/* Thẻ div trên cùng với nút điều hướng Trái / Phải */}
          <div className="flex items-center gap-3 sm:gap-5 max-w-4xl mx-auto">
            <button aria-label="Vùng trước" className="hidden sm:flex w-11 h-11 lg:w-12 lg:h-12 shrink-0 rounded-full border-2 border-slate-200 bg-white hover:border-sun hover:bg-sun/15 text-slate-700 hover:text-amber-700 items-center justify-center shadow-md transition-all cursor-pointer" id="zonePrevBtn" type="button">
              <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path></svg>
            </button>
            <div className="relative flex-1 min-w-0">
              <div aria-hidden="true" className="hidden sm:block absolute inset-x-3 -bottom-2.5 h-6 rounded-2xl bg-amber-50/90 border border-sun/40 shadow-sm pointer-events-none"></div>
              <div className="relative z-10" id="zoneCardsStage">
          <div className="zone-slide-card p-5 sm:p-6 rounded-2xl bg-white border-2 border-sun/60 transition-all shadow-lg flex flex-col justify-between" data-zone-index="0">
            <div>
              <div className="flex items-start gap-2.5 mb-2 sm:mb-2.5">
                <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-lg bg-sun/20 border border-sun/40 text-base sm:text-lg font-black font-display text-amber-700 shrink-0 mt-0.5">1</span>
                <h4 className="font-extrabold text-base sm:text-lg text-slate-900 leading-snug">Vùng lõi đô thị - tài chính - quản trị - di sản:</h4>
              </div>
              <p className="text-base text-slate-700 leading-[1.65]">Là trung tâm chính trị, hành chính, tài chính, thương mại, dịch vụ du lịch cao cấp và công viên chuyên đề, văn hóa, lịch sử, giáo dục, y tế và đối ngoại của Thành phố, tập trung tại khu trung tâm đô thị lịch sử hiện hữu, khu vực Sài Gòn - Chợ Lớn - Thủ Thiêm... và hai bờ sông Sài Gòn đoạn trung tâm.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 mt-3.5 sm:mt-4 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-3 sm:gap-2.5 px-3 py-2.5 sm:p-2.5 rounded-xl bg-sun/10 border border-sun/40">
                <div className="w-8 h-8 rounded-lg bg-white border border-sun/40 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path></svg>
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-500 leading-tight">Quy mô diện tích khoảng</div>
                  <div className="text-base sm:text-lg font-black font-display text-amber-700 tabular-nums leading-tight mt-0.5" data-countup>17.000 - 17.500 ha</div>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:gap-2.5 px-3 py-2.5 sm:p-2.5 rounded-xl bg-orange-50/90 border border-orange-200/80">
                <div className="w-8 h-8 rounded-lg bg-white border border-orange-200 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-energy" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-500 leading-tight">Dân số dự kiến khoảng</div>
                  <div className="text-base sm:text-lg font-black font-display text-energy tabular-nums leading-tight mt-0.5" data-countup>5,90 - 6,20 triệu người</div>
                </div>
              </div>
            </div>
          </div>
          <div className="zone-slide-card hidden p-5 sm:p-6 rounded-2xl bg-white border-2 border-sun/60 transition-all shadow-lg flex flex-col justify-between" data-zone-index="1">
            <div>
              <div className="flex items-start gap-2.5 mb-2 sm:mb-2.5">
                <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-lg bg-sun/20 border border-sun/40 text-base sm:text-lg font-black font-display text-amber-700 shrink-0 mt-0.5">2</span>
                <h4 className="font-extrabold text-base sm:text-lg text-slate-900 leading-snug">Vùng đổi mới sáng tạo phía Đông:</h4>
              </div>
              <p className="text-base text-slate-700 leading-[1.65]">Là vùng đô thị động lực phía Đông Bắc; trung tâm khoa học - công nghệ, giáo dục - đào tạo, đổi mới sáng tạo, công nghiệp công nghệ cao và kinh tế số của Thành phố, đồng thời là đầu mối liên kết với Long Thành và vùng Đông Nam Bộ.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 mt-3.5 sm:mt-4 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-3 sm:gap-2.5 px-3 py-2.5 sm:p-2.5 rounded-xl bg-sun/10 border border-sun/40">
                <div className="w-8 h-8 rounded-lg bg-white border border-sun/40 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path></svg>
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-500 leading-tight">Quy mô diện tích khoảng</div>
                  <div className="text-base sm:text-lg font-black font-display text-amber-700 tabular-nums leading-tight mt-0.5" data-countup>42.900 - 43.300 ha</div>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:gap-2.5 px-3 py-2.5 sm:p-2.5 rounded-xl bg-orange-50/90 border border-orange-200/80">
                <div className="w-8 h-8 rounded-lg bg-white border border-orange-200 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-energy" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-500 leading-tight">Dân số dự kiến khoảng</div>
                  <div className="text-base sm:text-lg font-black font-display text-energy tabular-nums leading-tight mt-0.5" data-countup>4,98 - 5,25 triệu người</div>
                </div>
              </div>
            </div>
          </div>
          <div className="zone-slide-card hidden p-5 sm:p-6 rounded-2xl bg-white border-2 border-sun/60 transition-all shadow-lg flex flex-col justify-between" data-zone-index="2">
            <div>
              <div className="flex items-start gap-2.5 mb-2 sm:mb-2.5">
                <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-lg bg-sun/20 border border-sun/40 text-base sm:text-lg font-black font-display text-amber-700 shrink-0 mt-0.5">3</span>
                <h4 className="font-extrabold text-base sm:text-lg text-slate-900 leading-snug">Vùng Tây - Tây Nam:</h4>
              </div>
              <p className="text-base text-slate-700 leading-[1.65]">Là cửa ngõ kết nối Thành phố với Đồng bằng sông Cửu Long; phát triển các chức năng logistics, thương mại, công nghiệp đảm bảo các tiêu chí môi trường đô thị, y sinh, y tế, giáo dục - đào tạo, dịch vụ và đô thị sinh thái.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 mt-3.5 sm:mt-4 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-3 sm:gap-2.5 px-3 py-2.5 sm:p-2.5 rounded-xl bg-sun/10 border border-sun/40">
                <div className="w-8 h-8 rounded-lg bg-white border border-sun/40 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path></svg>
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-500 leading-tight">Quy mô diện tích khoảng</div>
                  <div className="text-base sm:text-lg font-black font-display text-amber-700 tabular-nums leading-tight mt-0.5" data-countup>83.200 - 83.600 ha</div>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:gap-2.5 px-3 py-2.5 sm:p-2.5 rounded-xl bg-orange-50/90 border border-orange-200/80">
                <div className="w-8 h-8 rounded-lg bg-white border border-orange-200 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-energy" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-500 leading-tight">Dân số dự kiến khoảng</div>
                  <div className="text-base sm:text-lg font-black font-display text-energy tabular-nums leading-tight mt-0.5" data-countup>5,79 - 6,09 triệu người</div>
                </div>
              </div>
            </div>
          </div>
          <div className="zone-slide-card hidden p-5 sm:p-6 rounded-2xl bg-white border-2 border-sun/60 transition-all shadow-lg flex flex-col justify-between" data-zone-index="3">
            <div>
              <div className="flex items-start gap-2.5 mb-2 sm:mb-2.5">
                <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-lg bg-sun/20 border border-sun/40 text-base sm:text-lg font-black font-display text-amber-700 shrink-0 mt-0.5">4</span>
                <h4 className="font-extrabold text-base sm:text-lg text-slate-900 leading-snug">Vùng đô thị công nghiệp - dịch vụ phía Bắc:</h4>
              </div>
              <p className="text-base text-slate-700 leading-[1.65]">Là hậu phương sản xuất hiện đại và cửa ngõ liên kết vùng phía Bắc của Thành phố; tập trung công nghiệp công nghệ cao, công nghệ tiên tiến, công nghiệp xanh, logistics, dịch vụ kỹ thuật, đô thị thông minh và đào tạo nhân lực.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 mt-3.5 sm:mt-4 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-3 sm:gap-2.5 px-3 py-2.5 sm:p-2.5 rounded-xl bg-sun/10 border border-sun/40">
                <div className="w-8 h-8 rounded-lg bg-white border border-sun/40 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path></svg>
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-500 leading-tight">Quy mô diện tích khoảng</div>
                  <div className="text-base sm:text-lg font-black font-display text-amber-700 tabular-nums leading-tight mt-0.5" data-countup>160.000 - 160.400 ha</div>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:gap-2.5 px-3 py-2.5 sm:p-2.5 rounded-xl bg-orange-50/90 border border-orange-200/80">
                <div className="w-8 h-8 rounded-lg bg-white border border-orange-200 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-energy" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-500 leading-tight">Dân số dự kiến khoảng</div>
                  <div className="text-base sm:text-lg font-black font-display text-energy tabular-nums leading-tight mt-0.5" data-countup>3,10 - 3,26 triệu người</div>
                </div>
              </div>
            </div>
          </div>
          <div className="zone-slide-card hidden p-5 sm:p-6 rounded-2xl bg-white border-2 border-sun/60 transition-all shadow-lg flex flex-col justify-between" data-zone-index="4">
            <div>
              <div className="flex items-start gap-2.5 mb-2 sm:mb-2.5">
                <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-lg bg-sun/20 border border-sun/40 text-base sm:text-lg font-black font-display text-amber-700 shrink-0 mt-0.5">5</span>
                <h4 className="font-extrabold text-base sm:text-lg text-slate-900 leading-snug">Vùng sinh thái và dự trữ phát triển:</h4>
              </div>
              <p className="text-base text-slate-700 leading-[1.65]">gồm tiểu vùng ở phía Bắc, Tây Bắc và tiểu vùng phía Đông Nam Thành phố là vùng cân bằng sinh thái; bảo vệ nguồn nước, rừng, đa dạng sinh học, nông nghiệp công nghệ cao; và quỹ đất dự trữ dài hạn của Thành phố.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 mt-3.5 sm:mt-4 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-3 sm:gap-2.5 px-3 py-2.5 sm:p-2.5 rounded-xl bg-sun/10 border border-sun/40">
                <div className="w-8 h-8 rounded-lg bg-white border border-sun/40 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path></svg>
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-500 leading-tight">Quy mô diện tích khoảng</div>
                  <div className="text-base sm:text-lg font-black font-display text-amber-700 tabular-nums leading-tight mt-0.5" data-countup>130.200 - 131.000 ha</div>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:gap-2.5 px-3 py-2.5 sm:p-2.5 rounded-xl bg-orange-50/90 border border-orange-200/80">
                <div className="w-8 h-8 rounded-lg bg-white border border-orange-200 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-energy" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-500 leading-tight">Dân số dự kiến khoảng</div>
                  <div className="text-base sm:text-lg font-black font-display text-energy tabular-nums leading-tight mt-0.5" data-countup>0,84 - 0,98 triệu người</div>
                </div>
              </div>
            </div>
          </div>
          <div className="zone-slide-card hidden p-5 sm:p-6 rounded-2xl bg-white border-2 border-sun/60 transition-all shadow-lg flex flex-col justify-between" data-zone-index="5">
            <div>
              <div className="flex items-start gap-2.5 mb-2 sm:mb-2.5">
                <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-lg bg-sun/20 border border-sun/40 text-base sm:text-lg font-black font-display text-amber-700 shrink-0 mt-0.5">6</span>
                <h4 className="font-extrabold text-base sm:text-lg text-slate-900 leading-snug">Vùng phía Tây Bắc và phía Nam:</h4>
              </div>
              <p className="text-base text-slate-700 leading-[1.65]">gồm tiểu vùng phía Tây Bắc Hóc Môn - Củ Chi kết nối với cửa ngõ phía Tây Bắc của đô thị trung tâm và tiểu vùng phía Nam Nhà Bè - Hiệp Phước kết nối với cửa ngõ phía Nam của đô thị trung tâm.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 mt-3.5 sm:mt-4 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-3 sm:gap-2.5 px-3 py-2.5 sm:p-2.5 rounded-xl bg-sun/10 border border-sun/40">
                <div className="w-8 h-8 rounded-lg bg-white border border-sun/40 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path></svg>
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-500 leading-tight">Quy mô diện tích khoảng</div>
                  <div className="text-base sm:text-lg font-black font-display text-amber-700 tabular-nums leading-tight mt-0.5" data-countup>18.100 - 18.500 ha</div>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:gap-2.5 px-3 py-2.5 sm:p-2.5 rounded-xl bg-orange-50/90 border border-orange-200/80">
                <div className="w-8 h-8 rounded-lg bg-white border border-orange-200 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-energy" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-500 leading-tight">Dân số dự kiến khoảng</div>
                  <div className="text-base sm:text-lg font-black font-display text-energy tabular-nums leading-tight mt-0.5" data-countup>2,17 - 2,28 triệu người</div>
                </div>
              </div>
            </div>
          </div>
          <div className="zone-slide-card hidden p-5 sm:p-6 rounded-2xl bg-white border-2 border-sun/60 transition-all shadow-lg flex flex-col justify-between" data-zone-index="6">
            <div>
              <div className="flex items-start gap-2.5 mb-2 sm:mb-2.5">
                <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-lg bg-sun/20 border border-sun/40 text-base sm:text-lg font-black font-display text-amber-700 shrink-0 mt-0.5">7</span>
                <h4 className="font-extrabold text-base sm:text-lg text-slate-900 leading-snug">Vùng sinh thái biển Cần Giờ:</h4>
              </div>
              <p className="text-base text-slate-700 leading-[1.65]">Là không gian sinh thái biển đặc thù, cửa ngõ hướng biển và trung tâm kinh tế biển của Thành phố, gắn với rừng ngập mặn, du lịch sinh thái, nghỉ dưỡng, kinh tế biển, cảng, logistics, hậu cần nghề cá và nghiên cứu biển.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 mt-3.5 sm:mt-4 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-3 sm:gap-2.5 px-3 py-2.5 sm:p-2.5 rounded-xl bg-sun/10 border border-sun/40">
                <div className="w-8 h-8 rounded-lg bg-white border border-sun/40 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path></svg>
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-500 leading-tight">Quy mô diện tích khoảng</div>
                  <div className="text-base sm:text-lg font-black font-display text-amber-700 tabular-nums leading-tight mt-0.5" data-countup>71.900 - 72.300 ha</div>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:gap-2.5 px-3 py-2.5 sm:p-2.5 rounded-xl bg-orange-50/90 border border-orange-200/80">
                <div className="w-8 h-8 rounded-lg bg-white border border-orange-200 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-energy" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-500 leading-tight">Dân số dự kiến khoảng</div>
                  <div className="text-base sm:text-lg font-black font-display text-energy tabular-nums leading-tight mt-0.5" data-countup>0,56 - 0,59 triệu người</div>
                </div>
              </div>
            </div>
          </div>
          <div className="zone-slide-card hidden p-5 sm:p-6 rounded-2xl bg-white border-2 border-sun/60 transition-all shadow-lg flex flex-col justify-between" data-zone-index="7">
            <div>
              <div className="flex items-start gap-2.5 mb-2 sm:mb-2.5">
                <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-lg bg-sun/20 border border-sun/40 text-base sm:text-lg font-black font-display text-amber-700 shrink-0 mt-0.5">8</span>
                <h4 className="font-extrabold text-base sm:text-lg text-slate-900 leading-snug">Vùng cảng biển - logistics - công nghiệp - năng lượng:</h4>
              </div>
              <p className="text-base text-slate-700 leading-[1.65]">Là vùng động lực kinh tế phía Đông Nam, cửa ngõ giao thương quốc tế và trung tâm liên kết chuỗi sản xuất - logistics - cảng biển của Thành phố với vùng Đông Nam Bộ, và mạng lưới kinh tế quốc tế.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 mt-3.5 sm:mt-4 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-3 sm:gap-2.5 px-3 py-2.5 sm:p-2.5 rounded-xl bg-sun/10 border border-sun/40">
                <div className="w-8 h-8 rounded-lg bg-white border border-sun/40 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path></svg>
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-500 leading-tight">Quy mô diện tích khoảng</div>
                  <div className="text-base sm:text-lg font-black font-display text-amber-700 tabular-nums leading-tight mt-0.5" data-countup>99.400 - 99.800 ha</div>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:gap-2.5 px-3 py-2.5 sm:p-2.5 rounded-xl bg-orange-50/90 border border-orange-200/80">
                <div className="w-8 h-8 rounded-lg bg-white border border-orange-200 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-energy" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-500 leading-tight">Dân số dự kiến khoảng</div>
                  <div className="text-base sm:text-lg font-black font-display text-energy tabular-nums leading-tight mt-0.5" data-countup>1,11 - 1,34 triệu người</div>
                </div>
              </div>
            </div>
          </div>
          <div className="zone-slide-card hidden p-5 sm:p-6 rounded-2xl bg-white border-2 border-sun/60 transition-all shadow-lg flex flex-col justify-between" data-zone-index="8">
            <div>
              <div className="flex items-start gap-2.5 mb-2 sm:mb-2.5">
                <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-lg bg-sun/20 border border-sun/40 text-base sm:text-lg font-black font-display text-amber-700 shrink-0 mt-0.5">9</span>
                <h4 className="font-extrabold text-base sm:text-lg text-slate-900 leading-snug">Vùng du lịch biển Vũng Tàu - Long Hải - Hồ Tràm - Bình Châu:</h4>
              </div>
              <p className="text-base text-slate-700 leading-[1.65]">Là vùng đô thị - du lịch - dịch vụ biển và sinh thái ven biển trọng điểm, giữ vai trò cửa ngõ du lịch hướng biển và trung tâm nghỉ dưỡng, vui chơi giải trí, chăm sóc sức khỏe và kinh tế biển của Thành phố.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 mt-3.5 sm:mt-4 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-3 sm:gap-2.5 px-3 py-2.5 sm:p-2.5 rounded-xl bg-sun/10 border border-sun/40">
                <div className="w-8 h-8 rounded-lg bg-white border border-sun/40 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path></svg>
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-500 leading-tight">Quy mô diện tích khoảng</div>
                  <div className="text-base sm:text-lg font-black font-display text-amber-700 tabular-nums leading-tight mt-0.5" data-countup>45.700 - 46.100 ha</div>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:gap-2.5 px-3 py-2.5 sm:p-2.5 rounded-xl bg-orange-50/90 border border-orange-200/80">
                <div className="w-8 h-8 rounded-lg bg-white border border-orange-200 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-energy" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-500 leading-tight">Dân số dự kiến khoảng</div>
                  <div className="text-base sm:text-lg font-black font-display text-energy tabular-nums leading-tight mt-0.5" data-countup>0,99 - 1,05 triệu người</div>
                </div>
              </div>
            </div>
          </div>
          <div className="zone-slide-card hidden p-5 sm:p-6 rounded-2xl bg-white border-2 border-sun/60 transition-all shadow-lg flex flex-col justify-between" data-zone-index="9">
            <div>
              <div className="flex items-start gap-2.5 mb-2 sm:mb-2.5">
                <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-lg bg-sun/20 border border-sun/40 text-base sm:text-lg font-black font-display text-amber-700 shrink-0 mt-0.5">10</span>
                <h4 className="font-extrabold text-base sm:text-lg text-slate-900 leading-snug">Đặc khu Côn Đảo:</h4>
              </div>
              <p className="text-base text-slate-700 leading-[1.65]">Là không gian biển đảo đặc thù, kết hợp đô thị sinh thái - di sản - du lịch - quốc phòng, an ninh, kết hợp du lịch trải nghiệm phát huy văn hóa địa phương, có vai trò là điểm đến du lịch văn hóa, lịch sử có ý nghĩa quốc gia và định hướng vươn tầm quốc tế.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 mt-3.5 sm:mt-4 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-3 sm:gap-2.5 px-3 py-2.5 sm:p-2.5 rounded-xl bg-sun/10 border border-sun/40">
                <div className="w-8 h-8 rounded-lg bg-white border border-sun/40 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path></svg>
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-500 leading-tight">Quy mô diện tích khoảng</div>
                  <div className="text-base sm:text-lg font-black font-display text-amber-700 tabular-nums leading-tight mt-0.5" data-countup>7.500 - 8.100 ha</div>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:gap-2.5 px-3 py-2.5 sm:p-2.5 rounded-xl bg-orange-50/90 border border-orange-200/80">
                <div className="w-8 h-8 rounded-lg bg-white border border-orange-200 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-energy" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-500 leading-tight">Dân số dự kiến khoảng</div>
                  <div className="text-base sm:text-lg font-black font-display text-energy tabular-nums leading-tight mt-0.5" data-countup>0,065 - 0,07 triệu người</div>
                </div>
              </div>
            </div>
          </div>
              </div>
            </div>
            <button aria-label="Vùng tiếp theo" className="hidden sm:flex w-11 h-11 lg:w-12 lg:h-12 shrink-0 rounded-full border-2 border-slate-200 bg-white hover:border-sun hover:bg-sun/15 text-slate-700 hover:text-amber-700 items-center justify-center shadow-md transition-all cursor-pointer" id="zoneNextBtn" type="button">
              <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path></svg>
            </button>
          </div>

          {/* Điều hướng Mobile (Trái / Mốc hiện tại / Phải) */}
          <div className="flex sm:hidden items-center justify-between gap-3 pt-1">
            <button aria-label="Vùng trước" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border-2 border-slate-200 bg-white hover:border-sun hover:bg-sun/15 text-slate-700 font-bold text-sm shadow-sm transition-all" id="zonePrevBtnMobile" type="button">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path></svg>
              <span>Trước</span>
            </button>
            <span className="text-sm font-black font-display text-amber-700 bg-sun/15 border border-sun/40 px-3.5 py-1 rounded-full tabular-nums" id="zoneCounterMobile">1 / 10</span>
            <button aria-label="Vùng tiếp theo" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border-2 border-slate-200 bg-white hover:border-sun hover:bg-sun/15 text-slate-700 font-bold text-sm shadow-sm transition-all" id="zoneNextBtnMobile" type="button">
              <span>Tiếp</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path></svg>
            </button>
          </div>
{/* Khung Ảnh Kết bài (Full-width Editorial Banner) */}
      <div className="auto-photo-slideshow relative w-full rounded-3xl overflow-hidden shadow-2xl bg-slate-950 mb-4 group h-[480px] sm:h-[600px] lg:h-[720px] select-none" id="autoPhotoSlideshow">
        <div className="absolute inset-0 w-full h-full">
          <div className="slideshow-slide absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out opacity-100 z-10 pointer-events-auto">
            <img alt="TPHCM 1" className="w-full h-full object-cover object-center" src="/report-images/tphcm-1.jpg" />
          </div>
          <div className="slideshow-slide absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out opacity-0 z-0 pointer-events-none">
            <img alt="TPHCM 2" className="w-full h-full object-cover object-center" src="/report-images/tphcm-2.jpg" />
          </div>
          <div className="slideshow-slide absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out opacity-0 z-0 pointer-events-none">
            <img alt="TPHCM 3" className="w-full h-full object-cover object-center" src="/report-images/tphcm-3.jpg" />
          </div>
          <div className="slideshow-slide absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out opacity-0 z-0 pointer-events-none">
            <img alt="TPHCM 4" className="w-full h-full object-cover object-center" src="/report-images/tphcm-4.jpg" />
          </div>
        </div>
        <button aria-label="Previous image" className="slideshow-prev-btn absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-slate-900/40 hover:bg-slate-900/80 backdrop-blur-md text-white border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg" id="autoSlidePrevBtn" type="button">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
        </button>
        <button aria-label="Next image" className="slideshow-next-btn absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-slate-900/40 hover:bg-slate-900/80 backdrop-blur-md text-white border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg" id="autoSlideNextBtn" type="button">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
        </button>
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 px-4 py-2 rounded-full bg-black/40 backdrop-blur-md border border-white/20 shadow-md" id="slideshowDots">
          <button aria-label="Slide 1" className="auto-slide-dot w-2.5 h-2.5 rounded-full transition-all duration-300 bg-white scale-125" data-slide="0" type="button"></button>
          <button aria-label="Slide 2" className="auto-slide-dot w-2.5 h-2.5 rounded-full transition-all duration-300 bg-white/40 hover:bg-white/80" data-slide="1" type="button"></button>
          <button aria-label="Slide 3" className="auto-slide-dot w-2.5 h-2.5 rounded-full transition-all duration-300 bg-white/40 hover:bg-white/80" data-slide="2" type="button"></button>
          <button aria-label="Slide 4" className="auto-slide-dot w-2.5 h-2.5 rounded-full transition-all duration-300 bg-white/40 hover:bg-white/80" data-slide="3" type="button"></button>
          
        </div>
      </div>

        </div>
      </div>
    </section>

    {/* ========================================== */}
    {/* PHẦN 7: KINH TẾ BIỂN & GIAO THÔNG          */}
    {/* ĐA PHƯƠNG THỨC (NỀN XÁM BĂNG #F2F6FA)     */}
    {/* ========================================== */}
    <section className="py-20 bg-icegray border-t border-slate-200" id="sec-part7">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Khối 7.1 - Kinh tế biển */}
          <div className="p-6 sm:p-8 rounded-3xl bg-sky-50 border border-sky-200 shadow-sm space-y-4">
            <div className="flex flex-col items-center justify-center">
              <div aria-hidden="true" className="relative w-[72px] h-[72px] rounded-3xl bg-white border border-sky-200 shadow-sm flex items-center justify-center mb-3.5 anim-float">
                <svg className="w-[42px] h-[42px] text-sky-600" fill="none" viewBox="0 0 24 24">
                  <path d="M12 3.5L17.4 10.5H12V3.5Z" fill="#38BDF8" stroke="#0284C7" strokeLinejoin="round" strokeWidth="1.6"></path>
                  <path d="M10.4 5.4L6.6 10.5H10.4V5.4Z" fill="#BAE6FD" stroke="#0284C7" strokeLinejoin="round" strokeWidth="1.5"></path>
                  <path d="M5.2 11.8H18.8L17 14.1C16.7 14.4 16.3 14.6 15.8 14.6H8.2C7.7 14.6 7.3 14.4 7 14.1L5.2 11.8Z" fill="#0284C7"></path>
                  <path className="anim-wave" d="M3 16c1.5 1.2 3 1.2 4.5 0s3-1.2 4.5 0 3 1.2 4.5 0 3-1.2 4.5 0" stroke="#0284C7" strokeLinecap="round" strokeWidth="2"></path>
                  <path className="anim-wave" d="M4 19.5c1.5 1.1 3 1.1 4.5 0s3-1.1 4.5 0 3 1.1 4.5 0 3-1.1 3.5 0" stroke="#0EA5E9" strokeLinecap="round" strokeWidth="1.8" style={{ animationDelay: "0.4s" }}></path>
                </svg>
              </div>
              <div aria-hidden="true" className="w-24 sm:w-32 h-[3px] rounded-full mb-3 anim-divider" style={{ backgroundImage: "linear-gradient(90deg, transparent, #0284C7, #38BDF8, #0284C7, transparent)" }}></div>
              <h3 className="text-3xl sm:text-4xl leading-tight font-black text-sky-700 font-display text-center">Kinh tế biển mở rộng không gian chiến lược</h3>
            </div>
            <div className="text-base text-slate-700 leading-relaxed space-y-3">
              <p>Phát triển cụm cảng Cái Mép - Thị Vải, cảng Cái Mép Hạ và Cảng trung chuyển quốc tế Cần Giờ.</p>
              <p>Định hướng không gian biển - cửa sông - vịnh Gành Rái - Cần Giờ - Vũng Tàu - Cái Mép - Thị Vải làm cửa ngõ quốc tế chiến lược, phát huy vai trò cửa ngõ quốc tế của TPHCM và liên kết với vùng Đông Nam bộ, Đồng bằng sông Cửu Long và các hành lang kinh tế quốc tế.</p>
              <p>Định hướng khu vực Long Sơn là đô thị công nghiệp, dịch vụ, du lịch cao cấp gắn với trục phát triển Cần Giờ - Vũng Tàu - Bà Rịa - Phú Mỹ.</p>
            </div>
          </div>
          {/* Khối 7.2 - Giao thông đa phương thức & TOD */}
          <div className="p-6 sm:p-8 rounded-3xl bg-orange-50 border border-orange-200 shadow-sm space-y-4">
            <div className="flex flex-col items-center justify-center">
              <div aria-hidden="true" className="relative w-[72px] h-[72px] rounded-3xl bg-white border border-orange-200 shadow-sm flex items-center justify-center mb-3.5 overflow-hidden">
                <svg className="w-[42px] h-[42px] text-orange-600" fill="none" viewBox="0 0 24 24">
                  <g className="anim-train">
                    <rect height="10" rx="2.5" stroke="#EA580C" strokeWidth="2" width="14" x="5" y="5"></rect>
                    <path d="M5 10.5h14M9 15l-1.5 3M15 15l1.5 3" stroke="#EA580C" strokeLinecap="round" strokeWidth="2"></path>
                    <circle cx="8.5" cy="13" fill="#EA580C" r="1"></circle>
                    <circle cx="15.5" cy="13" fill="#EA580C" r="1"></circle>
                  </g>
                  <line stroke="#FDBA74" strokeLinecap="round" strokeWidth="1.8" x1="3" x2="21" y1="19.5" y2="19.5"></line>
                </svg>
              </div>
              <div aria-hidden="true" className="w-24 sm:w-32 h-[3px] rounded-full mb-3 anim-divider" style={{ backgroundImage: "linear-gradient(90deg, transparent, #EA580C, #FB923C, #EA580C, transparent)" }}></div>
              <h3 className="text-3xl sm:text-4xl leading-tight font-black text-orange-600 font-display text-center">Giao thông đa phương thức, ưu tiên metro, đường sắt liên vùng và giao thông công cộng gắn với mô hình TOD</h3>
            </div>
            <div className="text-base text-slate-700 leading-relaxed space-y-3">
              <p>Mạng lưới giao thông phát triển đa phương thức, các tuyến kết nối cảng biển - sân bay - khu công nghiệp - trung tâm logistics.</p>
              <p>Phát triển các đầu mối trung chuyển và khu vực TOD đồng bộ.</p>
              <div className="p-4 rounded-2xl bg-orange-100/60 border border-orange-200">
                <p className="text-sm font-bold text-slate-800 mt-1">Tăng cường kết nối với sân bay Tân Sơn Nhất, sân bay Long Thành, Ga liên vận Quốc tế An Bình, Cảng Cái Mép - Thị Vải, Cần Giờ, Vũng Tàu và Côn Đảo.</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/90 border border-orange-200 shadow-sm">
                <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                  <strong className="text-orange-600 font-black">Mạng lưới đường sắt đô thị (MRT):</strong> Đến năm 2050: Hoàn thành mạng lưới gồm <strong className="text-orange-600 font-black">18 tuyến MRT</strong> với tổng chiều dài khoảng <strong className="text-orange-600 font-black">960 km</strong> và mạng lưới LRT/Tramway dài khoảng <strong className="text-orange-600 font-black">450 km</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Dải Ảnh Minh họa Chuyển động Ngược Chiều */}
        <div className="space-y-4 overflow-hidden rounded-3xl bg-slate-900/5 p-3 sm:p-4 border border-slate-200/80">
          <div className="marquee-container space-y-3 overflow-hidden">
            <div className="overflow-hidden w-full relative">
              <div className="marquee-row-1 gap-3" id="metroTrack">
                <div className="relative w-[300px] h-[190px] sm:w-[420px] sm:h-[270px] shrink-0 rounded-2xl overflow-hidden shadow-md border border-slate-200 group cursor-pointer"><img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" src="/report-images/1-metro.jpg" /></div>
                <div className="relative w-[300px] h-[190px] sm:w-[420px] sm:h-[270px] shrink-0 rounded-2xl overflow-hidden shadow-md border border-slate-200 group cursor-pointer"><img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" src="/report-images/2-metro.jpg" /></div>
                <div className="relative w-[300px] h-[190px] sm:w-[420px] sm:h-[270px] shrink-0 rounded-2xl overflow-hidden shadow-md border border-slate-200 group cursor-pointer"><img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" src="/report-images/3-metro.jpg" /></div>
                <div className="relative w-[300px] h-[190px] sm:w-[420px] sm:h-[270px] shrink-0 rounded-2xl overflow-hidden shadow-md border border-slate-200 group cursor-pointer"><img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" src="/report-images/4-metro.jpg" /></div>
                <div className="relative w-[300px] h-[190px] sm:w-[420px] sm:h-[270px] shrink-0 rounded-2xl overflow-hidden shadow-md border border-slate-200 group cursor-pointer"><img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" src="/report-images/5-metro.jpg" /></div>
                <div aria-hidden="true" className="relative w-[300px] h-[190px] sm:w-[420px] sm:h-[270px] shrink-0 rounded-2xl overflow-hidden shadow-md border border-slate-200 group cursor-pointer"><img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" src="/report-images/1-metro.jpg" /></div>
                <div aria-hidden="true" className="relative w-[300px] h-[190px] sm:w-[420px] sm:h-[270px] shrink-0 rounded-2xl overflow-hidden shadow-md border border-slate-200 group cursor-pointer"><img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" src="/report-images/2-metro.jpg" /></div>
                <div aria-hidden="true" className="relative w-[300px] h-[190px] sm:w-[420px] sm:h-[270px] shrink-0 rounded-2xl overflow-hidden shadow-md border border-slate-200 group cursor-pointer"><img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" src="/report-images/3-metro.jpg" /></div>
                <div aria-hidden="true" className="relative w-[300px] h-[190px] sm:w-[420px] sm:h-[270px] shrink-0 rounded-2xl overflow-hidden shadow-md border border-slate-200 group cursor-pointer"><img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" src="/report-images/4-metro.jpg" /></div>
                <div aria-hidden="true" className="relative w-[300px] h-[190px] sm:w-[420px] sm:h-[270px] shrink-0 rounded-2xl overflow-hidden shadow-md border border-slate-200 group cursor-pointer"><img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" src="/report-images/5-metro.jpg" /></div>
              </div>
            </div>
            <div className="overflow-hidden w-full relative">
              <div className="marquee-row-2 gap-3" id="portTrack">
                <div className="relative w-[300px] h-[190px] sm:w-[420px] sm:h-[270px] shrink-0 rounded-2xl overflow-hidden shadow-md border border-slate-200 group cursor-pointer"><img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" src="/report-images/6-can-bien.jpg" /></div>
                <div className="relative w-[300px] h-[190px] sm:w-[420px] sm:h-[270px] shrink-0 rounded-2xl overflow-hidden shadow-md border border-slate-200 group cursor-pointer"><img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" src="/report-images/7-can-bien.jpg" /></div>
                <div className="relative w-[300px] h-[190px] sm:w-[420px] sm:h-[270px] shrink-0 rounded-2xl overflow-hidden shadow-md border border-slate-200 group cursor-pointer"><img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" src="/report-images/8-can-bien.jpg" /></div>
                <div className="relative w-[300px] h-[190px] sm:w-[420px] sm:h-[270px] shrink-0 rounded-2xl overflow-hidden shadow-md border border-slate-200 group cursor-pointer"><img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" src="/report-images/9-can-bien.jpg" /></div>
                <div className="relative w-[300px] h-[190px] sm:w-[420px] sm:h-[270px] shrink-0 rounded-2xl overflow-hidden shadow-md border border-slate-200 group cursor-pointer"><img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" src="/report-images/10-can-bien.jpg" /></div>
                <div aria-hidden="true" className="relative w-[300px] h-[190px] sm:w-[420px] sm:h-[270px] shrink-0 rounded-2xl overflow-hidden shadow-md border border-slate-200 group cursor-pointer"><img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" src="/report-images/6-can-bien.jpg" /></div>
                <div aria-hidden="true" className="relative w-[300px] h-[190px] sm:w-[420px] sm:h-[270px] shrink-0 rounded-2xl overflow-hidden shadow-md border border-slate-200 group cursor-pointer"><img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" src="/report-images/7-can-bien.jpg" /></div>
                <div aria-hidden="true" className="relative w-[300px] h-[190px] sm:w-[420px] sm:h-[270px] shrink-0 rounded-2xl overflow-hidden shadow-md border border-slate-200 group cursor-pointer"><img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" src="/report-images/8-can-bien.jpg" /></div>
                <div aria-hidden="true" className="relative w-[300px] h-[190px] sm:w-[420px] sm:h-[270px] shrink-0 rounded-2xl overflow-hidden shadow-md border border-slate-200 group cursor-pointer"><img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" src="/report-images/9-can-bien.jpg" /></div>
                <div aria-hidden="true" className="relative w-[300px] h-[190px] sm:w-[420px] sm:h-[270px] shrink-0 rounded-2xl overflow-hidden shadow-md border border-slate-200 group cursor-pointer"><img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" src="/report-images/10-can-bien.jpg" /></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* ========================================== */}
    {/* PHẦN 8: TIỆN ÍCH, HẠ TẦNG PHỤC VỤ NGƯỜI DÂN*/}
    {/* (ĐẾN 2050) & SLIDESHOW KẾT BÀI            */}
    {/* ========================================== */}
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" id="sec-part8">
      <div className="mb-12 flex flex-col items-center">
        <div aria-hidden="true" className="relative w-[72px] h-[72px] rounded-3xl bg-emerald-50 border border-emerald-200 shadow-sm flex items-center justify-center mb-3.5 anim-float">
          <span className="absolute inset-0 rounded-3xl border-2 border-mint/40 anim-pulse-ring"></span>
          <svg className="w-[42px] h-[42px]" fill="none" viewBox="0 0 24 24">
            <path d="M12 20s-6.5-4.2-8.2-8.1C2.6 9.1 4.4 6 7.5 6c1.9 0 3.5 1 4.5 2.5C13 7 14.6 6 16.5 6c3.1 0 4.9 3.1 3.7 5.9C18.5 15.8 12 20 12 20z" stroke="#00C896" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
            <path d="M8.5 12h2l1.2-2.2 1.6 4.4 1.2-2.2h1.5" stroke="#0057FF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"></path>
          </svg>
        </div>
        <div aria-hidden="true" className="w-28 sm:w-36 h-[3px] rounded-full mb-3 anim-divider" style={{ backgroundImage: "linear-gradient(90deg, transparent, #00C896, #0057FF, #00C896, transparent)" }}></div>
        <h2 className="text-3xl sm:text-4xl leading-tight font-black text-slate-900 font-display text-center">
          Tiện ích, hạ tầng phục vụ người dân (Đến 2050)
        </h2>
      </div>
      {/* Dashboard 6 Chỉ tiêu đến năm 2050 (Biểu đồ vòng tròn SVG + Số cực đại) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16" id="part8KpiGrid">
        {/* 1. Đất giao thông */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-md flex items-center gap-5">
          <div className="relative w-20 h-20 shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path className="text-slate-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3.5"></path>
              <path className="text-energy" data-ring-anim data-ring-target="10" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="10, 100" strokeWidth="3.5"></path>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center font-black text-sm text-energy tabular-nums" data-countup>≥6%</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl leading-tight font-black font-display text-energy huge-num tabular-nums" data-countup>≥ 6%</div>
            <div className="text-sm font-bold text-slate-700 mt-1">Tỷ lệ đất giao thông đô thị tối thiểu 6%.</div>
          </div>
        </div>
        {/* 2. Nước sạch */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-md flex items-center gap-5">
          <div className="relative w-20 h-20 shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path className="text-ice" data-ring-anim data-ring-target="100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="100, 100" strokeWidth="3.5"></path>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center font-black text-sm text-ice tabular-nums" data-countup>100%</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl leading-tight font-black font-display text-ice huge-num tabular-nums" data-countup>100%</div>
            <div className="text-sm font-bold text-slate-700 mt-1">100% dân số được cấp nước sạch;</div>
          </div>
        </div>
        {/* 3. Nước thải */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-md flex items-center gap-5">
          <div className="relative w-20 h-20 shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path className="text-slate-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3.5"></path>
              <path className="text-sun" data-ring-anim data-ring-target="80" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="80, 100" strokeWidth="3.5"></path>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center font-black text-sm text-sun tabular-nums" data-countup>~80%</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl leading-tight font-black font-display text-sun huge-num tabular-nums" data-countup>~80%</div>
            <div className="text-sm font-bold text-slate-700 mt-1">Thu gom và xử lý nước thải đô thị đạt khoảng 80%.</div>
          </div>
        </div>
        {/* 4. Rác thải rắn */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-md flex items-center gap-5">
          <div className="relative w-20 h-20 shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path className="text-mint" data-ring-anim data-ring-target="97" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="97, 100" strokeWidth="3.5"></path>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center font-black text-xs text-mint"></div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl leading-tight font-black font-display text-mint huge-num tabular-nums" data-countup>100% | ~95%</div>
            <div className="text-sm font-bold text-slate-700 mt-1">Thu gom, xử lý chất thải rắn đạt 100% ở đô thị và khoảng 95% ở nông thôn.</div>
          </div>
        </div>
        {/* 5. Diện tích sàn nhà ở */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-md flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-cobalt/10 flex items-center justify-center text-4xl shrink-0">
            🏡
          </div>
          <div>
            <div className="text-3xl sm:text-4xl leading-tight font-black font-display text-cobalt huge-num tabular-nums" data-countup>40 m²/người</div>
            <div className="text-sm font-bold text-slate-700 mt-1">Nhà ở: Phấn đấu diện tích sàn nhà ở bình quân đạt khoảng 40 m²/người;</div>
          </div>
        </div>
        {/* 6. Quy mô giường bệnh */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-md flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-energy/10 flex items-center justify-center text-4xl shrink-0">
            🏥
          </div>
          <div>
            <div className="text-3xl sm:text-4xl leading-tight font-black font-display text-energy huge-num tabular-nums" data-countup>40 - 50 giường</div>
            <div className="text-sm font-bold text-slate-700 mt-1">Quy mô giường bệnh khoảng 40 - 50 giường/10.000 dân</div>
          </div>
        </div>
      </div>

      {/* Khung Ảnh Kết bài (Full-width Editorial Banner) */}
      <div className="auto-photo-slideshow relative w-full rounded-3xl overflow-hidden shadow-2xl bg-slate-950 mb-4 group h-[480px] sm:h-[600px] lg:h-[720px] select-none" id="autoPhotoSlideshowPart8">
        <div className="absolute inset-0 w-full h-full">
          <div className="slideshow-slide absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out opacity-100 z-10 pointer-events-auto">
            <img alt="TPHCM 5" className="w-full h-full object-cover object-center" src="/report-images/tphcm-5.jpg" />
          </div>
          <div className="slideshow-slide absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out opacity-0 z-0 pointer-events-none">
            <img alt="TPHCM 6" className="w-full h-full object-cover object-center" src="/report-images/tphcm-6.jpg" />
          </div>
          <div className="slideshow-slide absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out opacity-0 z-0 pointer-events-none">
            <img alt="TPHCM 7" className="w-full h-full object-cover object-center" src="/report-images/tphcm-7.jpg" />
          </div>
          <div className="slideshow-slide absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out opacity-0 z-0 pointer-events-none">
            <img alt="TPHCM 8" className="w-full h-full object-cover object-center" src="/report-images/tphcm-8.jpg" />
          </div>
        </div>
        <button aria-label="Previous image" className="slideshow-prev-btn absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-slate-900/40 hover:bg-slate-900/80 backdrop-blur-md text-white border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg" id="autoSlidePrevBtnPart8" type="button">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
        </button>
        <button aria-label="Next image" className="slideshow-next-btn absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-slate-900/40 hover:bg-slate-900/80 backdrop-blur-md text-white border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg" id="autoSlideNextBtnPart8" type="button">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
        </button>
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 px-4 py-2 rounded-full bg-black/40 backdrop-blur-md border border-white/20 shadow-md" id="slideshowDotsPart8">
          <button aria-label="Slide 5" className="auto-slide-dot w-2.5 h-2.5 rounded-full transition-all duration-300 bg-white scale-125" data-slide="0" type="button"></button>
          <button aria-label="Slide 6" className="auto-slide-dot w-2.5 h-2.5 rounded-full transition-all duration-300 bg-white/40 hover:bg-white/80" data-slide="1" type="button"></button>
          <button aria-label="Slide 7" className="auto-slide-dot w-2.5 h-2.5 rounded-full transition-all duration-300 bg-white/40 hover:bg-white/80" data-slide="2" type="button"></button>
          <button aria-label="Slide 8" className="auto-slide-dot w-2.5 h-2.5 rounded-full transition-all duration-300 bg-white/40 hover:bg-white/80" data-slide="3" type="button"></button>
        </div>
      </div>
    </section>
  
    </div>
  );
}
