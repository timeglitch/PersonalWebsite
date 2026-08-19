/**
 * The microfiche viewer: a finite two-dimensional contact sheet seen through a
 * lens. Selecting a project pans and zooms the lens to that project's cluster;
 * the sheet can also be dragged, scrubbed and stepped through directly.
 *
 * The view is held in a ref and written straight to the DOM so that dragging
 * and travelling never re-render the ~30 cells on the sheet.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import SheetCell from "./SheetCell";
import { projects, type ProjectId } from "../projects";
import { cells, clusters, nearestClusterIndex, SHEET } from "./sheetData";
import { useTransportAudio } from "./useTransportAudio";
import "./microfiche.css";

type Props = {
    activeIndex: number;
    /** Reports where the lens has come to rest. Does not move it. */
    onActiveChange: (index: number) => void;
    /** Bumped by the index on every click, including a click on the active entry. */
    focusToken: number;
    hoveredIndex: number | null;
    soundOn: boolean;
};

type View = { x: number; y: number; zoom: number };

/** Pointer travel, in px, past which a gesture counts as a drag rather than a click. */
const DRAG_THRESHOLD = 7;
/** Share of the lens a cluster's framed block fills along its tighter axis.
 *  The remainder is what neighbouring cells peek through. */
const FRAME_FILL = 0.9;
/** Blank film the lens may show past the printed area, so clusters near an
 *  edge can still be centred. The sheet stays finite — this is its margin. */
const SHEET_BLEED = 3;
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 2.2;

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const easeOut = (t: number) => 1 - (1 - t) ** 3;
/** The opening travel's own curve. A cubic tail spends its last half-second
 *  covering a couple of pixels, which reads as the sheet sticking rather than
 *  landing; a square one decelerates evenly and still arrives at a standstill. */
const easeHome = (t: number) => 1 - (1 - t) ** 2;
/** How far off its mark the sheet parks before the opening travel, in units. */
const ENTRY_OFFSET = { x: 2.6, y: 1.6 };
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const lerpView = (from: View, to: View, t: number): View => ({
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t,
    zoom: from.zoom + (to.zoom - from.zoom) * t,
});

export default function MicroficheViewer({
    activeIndex,
    onActiveChange,
    focusToken,
    hoveredIndex,
    soundOn,
}: Props) {
    const stageRef = useRef<HTMLDivElement>(null);
    /** Lens-sized wrapper that carries the motion filter, so the blur never
     *  has to rasterise the whole sheet. */
    const filmRef = useRef<HTMLDivElement>(null);
    const sheetRef = useRef<HTMLDivElement>(null);
    const blurRef = useRef<SVGFEGaussianBlurElement>(null);

    const viewRef = useRef<View>({ x: 0, y: 0, zoom: 0.5 });
    const sizeRef = useRef({ width: 0, height: 0 });
    const frameRef = useRef<number | null>(null);
    /** The index the viewer itself last settled on, so its own snaps don't re-trigger travel. */
    const settledRef = useRef(activeIndex);
    const [ready, setReady] = useState(false);

    const transport = useTransportAudio(soundOn);
    // Seeded rather than left false until the first effect runs: the opening
    // frame is measured in a layout effect, which is earlier than that.
    const reducedMotionRef = useRef(
        typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );

    useEffect(() => {
        const query = window.matchMedia("(prefers-reduced-motion: reduce)");
        reducedMotionRef.current = query.matches;
        const sync = (event: MediaQueryListEvent) => {
            reducedMotionRef.current = event.matches;
        };
        query.addEventListener("change", sync);
        return () => query.removeEventListener("change", sync);
    }, []);

    /**
     * One magnification for the whole sheet, so travelling is a pure pan and
     * the lens never racks in or out between projects.
     *
     * It is the median of what each cluster's framed block would want, rather
     * than a fit for all of them: most clusters share a shape, and taking the
     * median lets that shape set the magnification instead of letting one
     * differently-shaped cluster pull every other project further away.
     */
    const sheetZoom = useCallback(() => {
        const { width, height } = sizeRef.current;
        if (!width || !height) return 0.5;
        const wanted = clusters
            .map(({ frame }) =>
                Math.min(width / (frame.w * SHEET.unit), height / (frame.h * SHEET.unit)),
            )
            .sort((a, b) => a - b);
        const median = wanted[Math.floor(wanted.length / 2)];
        return clamp(median * FRAME_FILL, MIN_ZOOM, MAX_ZOOM);
    }, []);

    /** Keep the lens over the sheet; `softness` allows rubber-banding while dragging. */
    const clampView = useCallback((view: View, softness = 0): View => {
        const { width, height } = sizeRef.current;
        const halfW = width / (2 * view.zoom * SHEET.unit);
        const halfH = height / (2 * view.zoom * SHEET.unit);

        const limit = (value: number, half: number, extent: number) => {
            const min = half - SHEET_BLEED;
            const max = extent - half + SHEET_BLEED;
            if (min >= max) return extent / 2;
            if (value < min) return softness ? min - (min - value) * softness : min;
            if (value > max) return softness ? max + (value - max) * softness : max;
            return value;
        };

        return {
            zoom: view.zoom,
            x: limit(view.x, halfW, SHEET.width),
            y: limit(view.y, halfH, SHEET.height),
        };
    }, []);

    const applyView = useCallback(() => {
        const sheet = sheetRef.current;
        if (!sheet) return;
        const { x, y, zoom } = viewRef.current;
        const { width, height } = sizeRef.current;
        sheet.style.transform =
            `translate3d(${width / 2}px, ${height / 2}px, 0) scale(${zoom}) ` +
            `translate3d(${-x * SHEET.unit}px, ${-y * SHEET.unit}px, 0)`;
        // The perforations ride the film's horizontal offset, so the edge
        // streams past whenever the sheet does.
        stageRef.current?.style.setProperty("--sprocket-x", `${-x * SHEET.unit * zoom}px`);
    }, []);

    /** Directional blur + contrast, driven by how fast the sheet is moving on screen. */
    const applyMotion = useCallback((screenVx: number, screenVy: number) => {
        const blur = blurRef.current;
        const film = filmRef.current;
        if (!blur || !film) return 0;
        const bx = clamp(Math.abs(screenVx) * 0.16, 0, 13);
        const by = clamp(Math.abs(screenVy) * 0.16, 0, 13);
        blur.setAttribute("stdDeviation", `${bx.toFixed(2)} ${by.toFixed(2)}`);
        const speed = Math.hypot(screenVx, screenVy);
        film.style.setProperty("--motion-contrast", String(1 + clamp(speed * 0.0035, 0, 0.22)));
        // The filter is only attached while moving; at rest the sheet renders
        // unrasterised so the captures and type stay crisp.
        film.classList.toggle("has-motion", speed > 0.4);
        return speed;
    }, []);

    const clearMotion = useCallback(() => {
        blurRef.current?.setAttribute("stdDeviation", "0 0");
        const film = filmRef.current;
        if (!film) return;
        film.style.setProperty("--motion-contrast", "1");
        film.classList.remove("has-motion");
    }, []);

    const cancelFrame = useCallback(() => {
        if (frameRef.current !== null) {
            cancelAnimationFrame(frameRef.current);
            frameRef.current = null;
        }
    }, []);

    /** Park the lens and drop every motion effect. */
    const settleAt = useCallback(
        (view: View) => {
            viewRef.current = view;
            applyView();
            clearMotion();
        },
        [applyView, clearMotion],
    );

    /**
     * The one duration-based animation driver. Everything timed runs through
     * here so only a single frame is ever in flight, and cancelFrame stops
     * whatever it is without the callers knowing about each other.
     */
    const tween = useCallback(
        (
            duration: number,
            ease: (t: number) => number,
            onStep: (eased: number) => void,
            onDone: () => void,
        ) => {
            const startedAt = performance.now();
            const step = (now: number) => {
                const t = clamp((now - startedAt) / duration, 0, 1);
                onStep(ease(t));
                if (t < 1) {
                    frameRef.current = requestAnimationFrame(step);
                    return;
                }
                frameRef.current = null;
                onDone();
            };
            frameRef.current = requestAnimationFrame(step);
        },
        [],
    );

    /** Animate the lens to a cluster. Travel time grows with distance. */
    const travelTo = useCallback(
        (index: number, options: { silent?: boolean } = {}) => {
            if (!sizeRef.current.width) return;
            cancelFrame();

            const from = { ...viewRef.current };
            const target = clampView({
                x: clusters[index].focus.x,
                y: clusters[index].focus.y,
                zoom: sheetZoom(),
            });
            const distance = Math.hypot(target.x - from.x, target.y - from.y);
            settledRef.current = index;

            if (reducedMotionRef.current || distance < 0.01) {
                // Reduced motion swaps the long pan for a short fade and a cut.
                settleAt(target);
                if (distance < 0.01) return;
                if (!options.silent) transport.lock();
                const film = filmRef.current;
                if (film) {
                    film.classList.remove("is-cut");
                    film.getBoundingClientRect(); // force a reflow so it replays
                    film.classList.add("is-cut");
                }
                return;
            }

            // The lock answers the press, not the arrival, so it fires now
            // rather than when the lens gets there.
            if (!options.silent) {
                transport.lock();
                transport.start();
            }
            let previous = from;

            tween(
                clamp(500 + distance * 36, 500, 1600),
                easeInOut,
                (eased) => {
                    // Travel is a pure pan: the lens holds its height and slides.
                    const next = lerpView(from, target, eased);
                    viewRef.current = next;
                    applyView();
                    const speed = applyMotion(
                        (next.x - previous.x) * SHEET.unit * next.zoom,
                        (next.y - previous.y) * SHEET.unit * next.zoom,
                    );
                    previous = next;
                    if (!options.silent) {
                        transport.setIntensity(
                            clamp(speed / 26, 0, 1) * clamp(0.45 + distance / 30, 0, 1),
                        );
                    }
                },
                () => {
                    settleAt(target);
                    if (!options.silent) transport.stop();
                },
            );
        },
        [applyMotion, applyView, cancelFrame, clampView, settleAt, transport, tween, sheetZoom],
    );

    /**
     * Where a drag or scrub comes to rest: exactly where it was left. Nothing
     * pulls the lens towards a cell. The only movement here is the rubber-band
     * overshoot springing back inside the sheet, which is a boundary, not an
     * alignment. The left column still follows along.
     */
    const comeToRest = useCallback(() => {
        cancelFrame();
        const from = viewRef.current;

        // Tell the list where we are, without letting that trigger a travel.
        const index = nearestClusterIndex(from.x, from.y);
        settledRef.current = index;
        if (index !== activeIndex) onActiveChange(index);

        const target = clampView(from, 0);
        if (Math.hypot(target.x - from.x, target.y - from.y) < 0.01 || reducedMotionRef.current) {
            settleAt(target);
            return;
        }

        tween(
            300,
            easeOut,
            (eased) => {
                viewRef.current = lerpView(from, target, eased);
                applyView();
            },
            () => {
                settleAt(target);
                transport.lock();
            },
        );
    }, [activeIndex, applyView, cancelFrame, clampView, onActiveChange, settleAt, transport, tween]);

    // Measure the lens and keep the current cluster framed through resizes.
    useLayoutEffect(() => {
        const stage = stageRef.current;
        if (!stage) return;

        const observer = new ResizeObserver((entries) => {
            const box = entries[0].contentRect;
            const first = sizeRef.current.width === 0;
            sizeRef.current = { width: box.width, height: box.height };
            if (first) {
                const index = settledRef.current;
                const opening = clampView({
                    x: clusters[index].focus.x,
                    y: clusters[index].focus.y,
                    zoom: sheetZoom(),
                });
                // Park off the opening frame; the entry travel below brings it
                // home, so the first thing the sheet does is move.
                entryRef.current = opening;
                // Reduced motion never parks: the jump home would be the only
                // thing it saw, which is worse than opening where it belongs.
                if (reducedMotionRef.current) {
                    viewRef.current = opening;
                    applyView();
                    setReady(true);
                    return;
                }
                const away = (sign: number) =>
                    clampView({
                        ...opening,
                        x: opening.x + ENTRY_OFFSET.x * sign,
                        y: opening.y + ENTRY_OFFSET.y * sign,
                    });
                const out = away(1);
                const reach = (v: View) => Math.hypot(v.x - opening.x, v.y - opening.y);
                viewRef.current = reach(out) > 0.7 ? out : away(-1);
                applyView();
                setReady(true);
            } else if (frameRef.current === null) {
                viewRef.current = clampView({ ...viewRef.current, zoom: sheetZoom() });
                applyView();
            }
        });

        observer.observe(stage);
        return () => observer.disconnect();
    }, [applyView, clampView, sheetZoom]);

    /**
     * Re-frame whenever the index is clicked. This is driven by a token rather
     * than by activeIndex changing, because after a drag the lens can be far
     * from the project the list already considers active — clicking that same
     * entry has to bring it back, and a value that never changes cannot say so.
     */
    const travelRef = useRef(travelTo);
    travelRef.current = travelTo;
    const activeRef = useRef(activeIndex);
    activeRef.current = activeIndex;
    const firstFocusRef = useRef(true);

    useEffect(() => {
        if (!ready) return;
        // The first measurement already framed the opening project.
        if (firstFocusRef.current) {
            firstFocusRef.current = false;
            return;
        }
        travelRef.current(activeRef.current);
    }, [focusToken, ready]);

    /**
     * The opening travel. The sheet starts off its mark and pans home, so the
     * first thing anyone sees is the film moving — a cursor only advertises the
     * drag once the pointer is already over the sheet, and this reaches someone
     * who never goes near it. Skipped if anything else already owns the frame,
     * so it can never fight a click made before it starts.
     */
    const entryRef = useRef<View | null>(null);
    const enteredRef = useRef(false);
    useEffect(() => {
        if (!ready || enteredRef.current) return;
        enteredRef.current = true;
        const target = entryRef.current;
        if (!target) return;
        if (reducedMotionRef.current) {
            settleAt(target);
            return;
        }
        const timer = window.setTimeout(() => {
            if (frameRef.current !== null) return;
            const from = { ...viewRef.current };
            let previous = from;
            tween(
                1600,
                easeHome,
                (eased) => {
                    const next = lerpView(from, target, eased);
                    viewRef.current = next;
                    applyView();
                    applyMotion(
                        (next.x - previous.x) * SHEET.unit * next.zoom,
                        (next.y - previous.y) * SHEET.unit * next.zoom,
                    );
                    previous = next;
                },
                () => settleAt(target),
            );
        }, 340);
        return () => window.clearTimeout(timer);
    }, [ready, tween, applyView, applyMotion, settleAt]);

    useEffect(() => cancelFrame, [cancelFrame]);

    // ── Direct manipulation ────────────────────────────────────────────────
    const dragRef = useRef({
        active: false,
        moved: false,
        captured: false,
        pointerId: -1,
        startX: 0,
        startY: 0,
        lastX: 0,
        lastY: 0,
        lastTime: 0,
        vx: 0,
        vy: 0,
    });
    /**
     * Pointer capture retargets the follow-up `click` to the capturing element,
     * so the cell under the press is remembered here at pointerdown instead.
     */
    const pressedRef = useRef<HTMLElement | null>(null);

    /**
     * Points the hover loupe at the cursor. Writing the centre repaints one
     * cell, so it is rate-limited to a single write per frame and skipped
     * entirely while dragging, when the reveal is suppressed anyway.
     */
    const loupeRef = useRef<{
        cell: HTMLElement | null;
        point: { x: number; y: number } | null;
        frame: number | null;
    }>({ cell: null, point: null, frame: null });

    const aimLoupe = useCallback((clientX: number, clientY: number, target: HTMLElement) => {
        const loupe = loupeRef.current;
        loupe.cell = target.closest<HTMLElement>("[data-cell]");
        if (!loupe.cell) return;
        loupe.point = { x: clientX, y: clientY };
        if (loupe.frame !== null) return;
        loupe.frame = requestAnimationFrame(() => {
            loupe.frame = null;
            const { cell, point } = loupeRef.current;
            if (!cell || !point) return;
            // The cell is inside the scaled sheet, so screen pixels have to come
            // back to the element's own coordinates before they mean anything.
            const rect = cell.getBoundingClientRect();
            const zoom = viewRef.current.zoom || 1;
            cell.style.setProperty("--loupe-x", `${(point.x - rect.left) / zoom}px`);
            cell.style.setProperty("--loupe-y", `${(point.y - rect.top) / zoom}px`);
        });
    }, []);

    useEffect(() => {
        const loupe = loupeRef.current;
        return () => {
            if (loupe.frame !== null) cancelAnimationFrame(loupe.frame);
        };
    }, []);

    const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        if (event.button !== 0) return;
        cancelFrame();
        transport.stop();
        const drag = dragRef.current;
        drag.active = true;
        drag.moved = false;
        drag.captured = false;
        drag.pointerId = event.pointerId;
        drag.startX = drag.lastX = event.clientX;
        drag.startY = drag.lastY = event.clientY;
        drag.lastTime = performance.now();
        drag.vx = drag.vy = 0;
        pressedRef.current = event.target as HTMLElement;
        // Stop the browser starting a text selection before the drag threshold
        // is crossed. Links keep their default so they still activate.
        if (!(event.target as HTMLElement).closest("a")) event.preventDefault();
    };

    const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        const drag = dragRef.current;
        if (!drag.moved) aimLoupe(event.clientX, event.clientY, event.target as HTMLElement);
        if (!drag.active || event.pointerId !== drag.pointerId) return;

        const dx = event.clientX - drag.lastX;
        const dy = event.clientY - drag.lastY;
        const now = performance.now();
        const dt = Math.max(1, now - drag.lastTime);

        if (
            !drag.moved &&
            Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) >= DRAG_THRESHOLD
        ) {
            drag.moved = true;
            // Capture only once it is a real drag, so plain clicks keep their
            // natural target and the pointer can leave the lens mid-gesture.
            event.currentTarget.setPointerCapture(event.pointerId);
            drag.captured = true;
            transport.start();
        }

        if (drag.moved) {
            const { zoom } = viewRef.current;
            viewRef.current = clampView(
                {
                    ...viewRef.current,
                    x: viewRef.current.x - dx / (SHEET.unit * zoom),
                    y: viewRef.current.y - dy / (SHEET.unit * zoom),
                },
                0.32,
            );
            applyView();
            const speed = applyMotion(-dx, -dy);
            transport.setIntensity(clamp(speed / 30, 0, 1));
        }

        // Exponential smoothing keeps a flick's velocity without a stray last frame.
        drag.vx = drag.vx * 0.7 + (dx / dt) * 0.3;
        drag.vy = drag.vy * 0.7 + (dy / dt) * 0.3;
        drag.lastX = event.clientX;
        drag.lastY = event.clientY;
        drag.lastTime = now;
    };

    /** Restrained glide after a flick, then settle on the nearest cluster. */
    const runInertia = useCallback(() => {
        const drag = dragRef.current;
        const { zoom } = viewRef.current;
        // Velocity is only sampled on pointermove, so holding still before
        // releasing would otherwise fling at the last speed recorded. Fade it
        // out by how long the pointer sat idle.
        const freshness = clamp(1 - (performance.now() - drag.lastTime) / 140, 0, 1);
        let vx = (-drag.vx * freshness) / (SHEET.unit * zoom);
        let vy = (-drag.vy * freshness) / (SHEET.unit * zoom);

        if (reducedMotionRef.current || Math.hypot(vx, vy) < 0.0006) {
            transport.stop();
            comeToRest();
            return;
        }

        let last = performance.now();
        const step = (now: number) => {
            const dt = Math.min(34, now - last);
            last = now;
            const decay = 0.9 ** (dt / 16.67);
            vx *= decay;
            vy *= decay;

            viewRef.current = clampView(
                {
                    ...viewRef.current,
                    x: viewRef.current.x + vx * dt,
                    y: viewRef.current.y + vy * dt,
                },
                0.18,
            );
            applyView();

            const screenVx = vx * dt * SHEET.unit * viewRef.current.zoom;
            const screenVy = vy * dt * SHEET.unit * viewRef.current.zoom;
            const speed = applyMotion(screenVx, screenVy);
            transport.setIntensity(clamp(speed / 30, 0, 1));

            if (Math.hypot(vx, vy) > 0.0006) {
                frameRef.current = requestAnimationFrame(step);
                return;
            }
            frameRef.current = null;
            clearMotion();
            transport.stop();
            comeToRest();
        };

        frameRef.current = requestAnimationFrame(step);
    }, [applyMotion, applyView, clampView, clearMotion, comeToRest, transport]);

    const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
        const drag = dragRef.current;
        if (!drag.active || event.pointerId !== drag.pointerId) return;
        drag.active = false;
        if (drag.captured && event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
        drag.captured = false;
        if (drag.moved) runInertia();
    };

    /**
     * A click only counts when the pointer stayed put. Clicking the centred
     * primary capture opens the live site; anything else centres its project.
     */
    const onClick = (event: React.MouseEvent<HTMLDivElement>) => {
        if (dragRef.current.moved) {
            event.preventDefault();
            event.stopPropagation();
            return;
        }

        const target = pressedRef.current ?? (event.target as HTMLElement);
        pressedRef.current = null;
        const cellNode = target.closest<HTMLElement>("[data-cell]");
        if (!cellNode) return;
        const cell = cells.find((entry) => entry.id === cellNode.dataset.cell);
        if (!cell) return;

        const activeProjectId: ProjectId = projects[activeIndex].id;
        const isCentredPrimary =
            cell.kind === "capture" && cell.primary === true && cell.project === activeProjectId;

        if (isCentredPrimary) {
            // The real anchor handles its own activation; don't open the site twice.
            if (target.closest("a")) return;
            const url = projects[activeIndex].url;
            if (url) window.open(url, "_blank", "noopener,noreferrer");
            return;
        }

        event.preventDefault();
        const index = cell.project
            ? projects.findIndex((project) => project.id === cell.project)
            : nearestClusterIndex(cell.x + cell.w / 2, cell.y + cell.h / 2);
        if (index < 0) return;
        if (index !== activeIndex) onActiveChange(index);
        travelTo(index);
    };

    // Wheel and trackpad scrub across nearby cells, then settle.
    useEffect(() => {
        const stage = stageRef.current;
        if (!stage) return;
        let settle: number | undefined;

        const onWheel = (event: WheelEvent) => {
            event.preventDefault();
            cancelFrame();
            const { zoom } = viewRef.current;
            viewRef.current = clampView(
                {
                    ...viewRef.current,
                    x: viewRef.current.x + event.deltaX / (SHEET.unit * zoom),
                    y: viewRef.current.y + event.deltaY / (SHEET.unit * zoom),
                },
                0.22,
            );
            applyView();
            transport.start();
            const speed = applyMotion(event.deltaX, event.deltaY);
            transport.setIntensity(clamp(speed / 40, 0, 1));

            window.clearTimeout(settle);
            settle = window.setTimeout(() => {
                clearMotion();
                transport.stop();
                comeToRest();
            }, 220);
        };

        stage.addEventListener("wheel", onWheel, { passive: false });
        return () => {
            stage.removeEventListener("wheel", onWheel);
            window.clearTimeout(settle);
        };
    }, [applyMotion, applyView, cancelFrame, clampView, clearMotion, comeToRest, transport]);

    const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        const step = (delta: number) => {
            event.preventDefault();
            const next = (activeIndex + delta + projects.length) % projects.length;
            onActiveChange(next);
            travelTo(next);
        };

        if (event.key === "ArrowRight" || event.key === "ArrowDown") step(1);
        else if (event.key === "ArrowLeft" || event.key === "ArrowUp") step(-1);
        else if (event.key === "Enter") {
            const url = projects[activeIndex].url;
            if (url) {
                event.preventDefault();
                window.open(url, "_blank", "noopener,noreferrer");
            }
        }
    };

    const activeProjectId = projects[activeIndex].id;
    // Hovering the project that is already centred has nothing to point at.
    const hintedProjectId =
        hoveredIndex !== null && hoveredIndex !== activeIndex ? projects[hoveredIndex].id : null;

    return (
        <div
            className={`fiche-window ${ready ? "is-ready" : ""}`}
            ref={stageRef}
            role="application"
            aria-roledescription="Microfiche viewer"
            aria-label={`Microfiche sheet, showing ${projects[activeIndex].name}. Use arrow keys to move between projects.`}
            tabIndex={0}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onClick={onClick}
            onKeyDown={onKeyDown}
        >
            {/* Directional blur, driven from the animation loop. */}
            <svg className="fiche-filter" aria-hidden="true" focusable="false">
                <filter id="fiche-transport-blur" x="-6%" y="-6%" width="112%" height="112%">
                    <feGaussianBlur ref={blurRef} in="SourceGraphic" stdDeviation="0 0" />
                </filter>
            </svg>

            <div className="fiche-film" ref={filmRef}>
                {/* Sheet extents come from SHEET so the stylesheet never has to
                    be kept in step with it by hand. */}
                <div
                    className="fiche-sheet"
                    ref={sheetRef}
                    style={{
                        ["--sheet-w" as string]: SHEET.width,
                        ["--sheet-h" as string]: SHEET.height,
                    }}
                >
                    <div className="fiche-grid" aria-hidden="true" />
                    {cells.map((cell) => (
                        <SheetCell
                            key={cell.id}
                            cell={cell}
                            project={projects.find((project) => project.id === cell.project)}
                            active={cell.project === activeProjectId}
                            hinted={hintedProjectId !== null && cell.project === hintedProjectId}
                        />
                    ))}
                </div>
            </div>

            <div className="fiche-sprockets is-top" aria-hidden="true" />
            <div className="fiche-sprockets is-bottom" aria-hidden="true" />
            <div className="fiche-lens" aria-hidden="true" />
        </div>
    );
}
