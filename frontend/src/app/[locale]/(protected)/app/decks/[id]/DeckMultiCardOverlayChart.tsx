'use client';

import * as d3 from 'd3';
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { eventTimeToMs, formatEventTime, previewCardRecto } from './deckDetailHelpers';
import {
  RATING_AGAIN_CROSS_ARM,
  RATING_MARKER_FADE_OPACITY,
  STABILITY_LONG_TERM_GOAL_DAYS,
  ratingFillCss,
  type CardReviewLogPoint,
  type RatingMarkerMode,
} from './CardReviewHistoryChart';

const M = { top: 14, right: 36, bottom: 54, left: 46 };

/** Outer radius of the help icon in chart space (matches Lucide circle r=10 scaled). */
const HELP_ICON_R = 9;

/**
 * Lucide `CircleQuestionMark` (a.k.a. circle-help) vector, viewBox 0 0 24 24.
 * Source: lucide-react `circle-question-mark` (ISC). Strokes use `currentColor`.
 */
function appendLucideCircleQuestionHelp(
  parent: d3.Selection<SVGGElement, unknown, null, undefined>,
  strokeCss: string
) {
  const k = HELP_ICON_R / 12;
  const inner = parent
    .append('g')
    .attr('transform', `scale(${k}) translate(-12,-12)`)
    .style('color', strokeCss);
  inner
    .append('circle')
    .attr('cx', 12)
    .attr('cy', 12)
    .attr('r', 10)
    .attr('fill', 'color-mix(in oklab, var(--mc-bg-surface) 88%, transparent)')
    .attr('stroke', 'currentColor')
    .attr('stroke-width', 2)
    .attr('stroke-linecap', 'round')
    .attr('stroke-linejoin', 'round');
  inner
    .append('path')
    .attr('d', 'M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3')
    .attr('fill', 'none')
    .attr('stroke', 'currentColor')
    .attr('stroke-width', 2)
    .attr('stroke-linecap', 'round')
    .attr('stroke-linejoin', 'round');
  inner
    .append('path')
    .attr('d', 'M12 17h.01')
    .attr('fill', 'none')
    .attr('stroke', 'currentColor')
    .attr('stroke-width', 2)
    .attr('stroke-linecap', 'round')
    .attr('stroke-linejoin', 'round');
}

type EndCapRow = {
  y: number;
  strokeColor: string;
  tooltip: string;
};

/** Avoid overlapping end-cap help icons (SVG y grows downward). */
function packEndLabels(items: EndCapRow[], lineH: number, minGap = HELP_ICON_R * 2 + 4): EndCapRow[] {
  const sorted = [...items].sort((a, b) => a.y - b.y);
  let prevY = -Infinity;
  const out: EndCapRow[] = [];
  for (const it of sorted) {
    let yPos = it.y;
    if (prevY !== -Infinity && yPos - prevY < minGap) {
      yPos = prevY + minGap;
    }
    yPos = Math.min(Math.max(yPos, 9), lineH - 5);
    out.push({ ...it, y: yPos });
    prevY = yPos;
  }
  return out;
}
const CHART_MIN_WIDTH = 320;
const CHART_HEIGHT = 300;
const R_BAND = 36;

type Metric = 'stability' | 'difficulty';

/** Local midnight (ms) for the calendar day containing `ms`. */
function startOfLocalDayMs(ms: number): number {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** End of that local calendar day (inclusive upper bound for “through this day”). */
function endOfLocalDayMsFromDayStart(dayStartMs: number): number {
  const d = new Date(dayStartMs);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).getTime();
}

function lastMetricYAtOrBefore(
  pts: Array<{ tMs: number; y: number }>,
  cutoffMs: number
): number | null {
  if (pts.length === 0 || pts[0]!.tMs > cutoffMs) return null;
  let lo = 0;
  let hi = pts.length - 1;
  let ans = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (pts[mid]!.tMs <= cutoffMs) {
      ans = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  return pts[ans]!.y;
}

export type DeckMultiCardOverlayChartLabels = {
  chartTitle: string;
  axisStability: string;
  axisDifficulty: string;
  axisTimeCaption: string;
  metricStability: string;
  metricDifficulty: string;
  hoverHint: string;
  emptyMetric: string;
  ratingMarkersSolid: string;
  ratingMarkersFaded: string;
  ratingMarkersHidden: string;
  ratingMarkersModeGroup: string;
  /** On-chart label for the S≥15d long-term zone (stability metric only). */
  stabilityLongTermGoalCaption: string;
  /** Accessible name (SVG title) for deck mean-by-day curve. */
  aggregateMeanCaption: string;
  /** Accessible name (SVG title) for deck median-by-day curve. */
  aggregateMedianCaption: string;
  /** Short label at plot right for mean (with numeric value). */
  lineEndMeanCaption: string;
  /** Short label at plot right for median (with numeric value). */
  lineEndMedianCaption: string;
  /** Tooltip for the ≥15d LTM reference (stability only). */
  lineTooltipLtm: string;
  /** Tooltip for the deck mean curve. */
  lineTooltipMean: string;
  /** Tooltip for the deck median curve. */
  lineTooltipMedian: string;
  /** Shared aria-label prefix for ? help icons (screen readers). */
  helpIconAria: string;
};

type CardSeries = {
  cardId: string;
  recto: string | null;
  color: string;
  points: Array<{ tMs: number; y: number; log: CardReviewLogPoint }>;
};

type Props = {
  cards: Array<{ cardId: string; recto: string | null; logs: CardReviewLogPoint[] }>;
  locale: string;
  labels: DeckMultiCardOverlayChartLabels;
  /** Optional: show rating name in hover tooltip (same keys as study: again/hard/good/easy). */
  ratingLabel?: (rating: number) => string;
};

function cardColor(i: number, n: number): string {
  if (n <= 0) return 'var(--mc-accent-success)';
  const h = (i * 360) / Math.max(n, 1);
  return `hsl(${h} 58% 42%)`;
}

export function DeckMultiCardOverlayChart({ cards, locale, labels, ratingLabel }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [viewportWidth, setViewportWidth] = useState(CHART_MIN_WIDTH);
  const [metric, setMetric] = useState<Metric>('stability');
  const [ratingMarkerMode, setRatingMarkerMode] = useState<RatingMarkerMode>('visible');
  const [tip, setTip] = useState<{ x: number; y: number; text: string } | null>(null);
  const titleId = useId();

  const seriesList = useMemo((): CardSeries[] => {
    const withIdx = cards.map((c, i) => {
      const pts: Array<{ tMs: number; y: number; log: CardReviewLogPoint }> = [];
      for (const log of c.logs) {
        const tMs = eventTimeToMs(log.review_time);
        if (tMs == null) continue;
        const yVal =
          metric === 'stability' ? log.stability_after : log.difficulty_after;
        if (yVal == null || !Number.isFinite(yVal)) continue;
        pts.push({ tMs, y: yVal, log });
      }
      pts.sort((a, b) => a.tMs - b.tMs);
      return {
        cardId: c.cardId,
        recto: c.recto,
        color: cardColor(i, cards.length),
        points: pts,
      };
    });
    return withIdx.filter((s) => s.points.length > 0);
  }, [cards, metric]);

  /** One sample per local calendar day that has ≥1 review anywhere in the deck. */
  const deckEvolution = useMemo(() => {
    if (seriesList.length === 0) return [] as Array<{ tMs: number; mean: number; median: number }>;

    const dayStarts = new Set<number>();
    for (const s of seriesList) {
      for (const p of s.points) {
        dayStarts.add(startOfLocalDayMs(p.tMs));
      }
    }
    const sortedDays = [...dayStarts].sort((a, b) => a - b);
    const out: Array<{ tMs: number; mean: number; median: number }> = [];

    for (const dayStart of sortedDays) {
      const cutoff = endOfLocalDayMsFromDayStart(dayStart);
      const slice: number[] = [];
      for (const s of seriesList) {
        const yVal = lastMetricYAtOrBefore(s.points, cutoff);
        if (yVal != null && Number.isFinite(yVal)) slice.push(yVal);
      }
      if (slice.length === 0) continue;
      const mean = d3.mean(slice);
      const median = d3.median(slice);
      if (mean == null || !Number.isFinite(mean) || median == null || !Number.isFinite(median))
        continue;
      out.push({ tMs: cutoff, mean, median });
    }
    return out;
  }, [seriesList]);

  const allT = useMemo(() => seriesList.flatMap((s) => s.points.map((p) => p.tMs)), [seriesList]);
  const tMin = allT.length ? d3.min(allT)! : Date.now();
  const tMax = allT.length ? d3.max(allT)! : Date.now();
  const spanT = Math.max(tMax - tMin, 60_000);
  const padT = Math.max(spanT * 0.04, 3_600_000);

  const innerW = Math.max(0, viewportWidth - M.left - M.right);
  const lineH = CHART_HEIGHT - M.top - M.bottom - R_BAND;

  const yExtent = useMemo(() => {
    const vals = seriesList.flatMap((s) => s.points.map((p) => p.y));
    const evoVals = deckEvolution.flatMap((e) => [e.mean, e.median]);
    const forExtent = vals.length ? [...vals, ...evoVals] : [];
    if (vals.length === 0) return { min: 0, max: 1 };
    if (metric === 'stability') {
      const maxS = Math.max(0.5, d3.max(forExtent) ?? 1);
      return {
        min: 0,
        max: Math.max(maxS * 1.12, STABILITY_LONG_TERM_GOAL_DAYS * 1.12),
      };
    }
    const dMin = Math.min(0, d3.min(forExtent) ?? 0);
    const dMax = Math.max(10, d3.max(forExtent) ?? 10);
    const dSpan = dMax - dMin;
    return { min: dMin, max: dMax + Math.max(dSpan * 0.08, 0.01) };
  }, [seriesList, metric, deckEvolution]);

  const chartTotalWidth = M.left + innerW + M.right;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => {
      setViewportWidth(Math.max(CHART_MIN_WIDTH, Math.round(el.clientWidth)));
    });
    ro.observe(el);
    setViewportWidth(Math.max(CHART_MIN_WIDTH, Math.round(el.clientWidth)));
    return () => ro.disconnect();
  }, []);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollLeft = Math.max(0, el.scrollWidth - el.clientWidth);
  }, [chartTotalWidth, seriesList.length, metric]);

  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl || seriesList.length === 0 || innerW <= 0) return;

    const xTime = d3
      .scaleTime()
      .domain([new Date(tMin - padT), new Date(tMax + padT)])
      .range([0, innerW]);

    const y = d3
      .scaleLinear()
      .domain([yExtent.min, yExtent.max])
      .range([lineH, 0]);

    const tickFormatTime = (d: Date | number) => {
      const date = d instanceof Date ? d : new Date(+d);
      if (spanT > 365 * 86_400_000) {
        return date.toLocaleDateString(locale, { year: 'numeric', month: 'short' });
      }
      if (spanT > 2 * 86_400_000) {
        return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
      }
      return date.toLocaleString(locale, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();
    svg.attr('width', chartTotalWidth).attr('height', CHART_HEIGHT).attr('aria-hidden', 'true');

    const g = svg.append('g').attr('transform', `translate(${M.left},${M.top})`);

    if (metric === 'stability') {
      const yG = y(STABILITY_LONG_TERM_GOAL_DAYS);
      const goalG = g.append('g').attr('class', 'deck-overlay-stability-ltm').style('pointer-events', 'none');
      goalG
        .append('line')
        .attr('x1', 0)
        .attr('x2', innerW)
        .attr('y1', yG)
        .attr('y2', yG)
        .attr('stroke', 'var(--mc-accent-success)')
        .attr('stroke-width', 1.25)
        .attr('stroke-dasharray', '5 4')
        .attr('opacity', 0.92);
    }

    const lineGen = d3
      .line<{ tMs: number; y: number }>()
      .x((d) => xTime(new Date(d.tMs)))
      .y((d) => y(d.y))
      .curve(d3.curveMonotoneX);

    for (const s of seriesList) {
      if (s.points.length >= 2) {
        g.append('path')
          .datum(s.points)
          .attr('fill', 'none')
          .attr('stroke', s.color)
          .attr('stroke-width', seriesList.length > 40 ? 1 : seriesList.length > 15 ? 1.25 : 1.75)
          .attr('stroke-opacity', 0.88)
          .attr('d', lineGen);
      }
    }

    const meanPathGen = d3
      .line<{ tMs: number; mean: number; median: number }>()
      .x((d) => xTime(new Date(d.tMs)))
      .y((d) => y(d.mean))
      .curve(d3.curveMonotoneX);
    const medianPathGen = d3
      .line<{ tMs: number; mean: number; median: number }>()
      .x((d) => xTime(new Date(d.tMs)))
      .y((d) => y(d.median))
      .curve(d3.curveMonotoneX);

    if (deckEvolution.length >= 2) {
      const aggG = g.append('g').attr('class', 'deck-overlay-deck-evolution').style('pointer-events', 'none');
      const meanPath = aggG
        .append('path')
        .datum(deckEvolution)
        .attr('fill', 'none')
        .attr('stroke', 'var(--mc-text-muted)')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '6 5')
        .attr('opacity', 0.95)
        .attr('d', meanPathGen);
      meanPath.append('title').text(labels.aggregateMeanCaption);
      const medPath = aggG
        .append('path')
        .datum(deckEvolution)
        .attr('fill', 'none')
        .attr('stroke', 'var(--mc-accent-primary)')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '3 4')
        .attr('opacity', 0.95)
        .attr('d', medianPathGen);
      medPath.append('title').text(labels.aggregateMedianCaption);
    } else if (deckEvolution.length === 1) {
      const aggG = g.append('g').attr('class', 'deck-overlay-deck-evolution').style('pointer-events', 'none');
      const d0 = deckEvolution[0]!;
      const xm = xTime(new Date(d0.tMs));
      const ym = y(d0.mean);
      const ymed = y(d0.median);
      aggG
        .append('circle')
        .attr('cx', xm)
        .attr('cy', ym)
        .attr('r', 4)
        .attr('fill', 'none')
        .attr('stroke', 'var(--mc-text-muted)')
        .attr('stroke-width', 2)
        .append('title')
        .text(labels.aggregateMeanCaption);
      aggG
        .append('circle')
        .attr('cx', xm)
        .attr('cy', ymed)
        .attr('r', 4)
        .attr('fill', 'none')
        .attr('stroke', 'var(--mc-accent-primary)')
        .attr('stroke-width', 2)
        .append('title')
        .text(labels.aggregateMedianCaption);
    }

    /** Rating-colored markers (cross for Again), aligned with CardReviewHistoryChart. */
    if (ratingMarkerMode !== 'hidden') {
      const visMarkers = g
        .append('g')
        .attr('class', 'deck-overlay-markers')
        .style('pointer-events', 'none')
        .attr('opacity', ratingMarkerMode === 'faded' ? RATING_MARKER_FADE_OPACITY : 1);
      for (const s of seriesList) {
        for (const p of s.points) {
          const cx = xTime(new Date(p.tMs));
          const cy = y(p.y);
          const fill = ratingFillCss(p.log.rating);
          if (p.log.rating === 1) {
            const arm = RATING_AGAIN_CROSS_ARM;
            const crossG = visMarkers.append('g').attr('transform', `translate(${cx},${cy})`);
            const d = `M ${-arm},${-arm} L ${arm},${arm} M ${-arm},${arm} L ${arm},${-arm}`;
            crossG
              .append('path')
              .attr('d', d)
              .attr('fill', 'none')
              .style('stroke', 'var(--mc-bg-surface)')
              .attr('stroke-width', 3)
              .attr('stroke-linecap', 'round');
            crossG
              .append('path')
              .attr('d', d)
              .attr('fill', 'none')
              .style('stroke', fill)
              .attr('stroke-width', 1.75)
              .attr('stroke-linecap', 'round');
          } else {
            visMarkers
              .append('circle')
              .attr('cx', cx)
              .attr('cy', cy)
              .attr('r', 5)
              .style('fill', fill)
              .style('stroke', 'var(--mc-bg-surface)')
              .attr('stroke-width', 1.5);
          }
        }
      }
    }

    const xAxisG = g.append('g').attr('transform', `translate(0,${lineH})`);
    const xAxis = d3
      .axisBottom(xTime)
      .ticks(Math.min(8, Math.max(3, Math.floor(innerW / 72))))
      .tickFormat((d) => tickFormatTime(d as Date));
    xAxisG.call(xAxis);
    xAxisG.call((sel) => {
      sel.select('.domain').remove();
      sel.selectAll('.tick line').style('stroke', 'var(--mc-border-subtle)');
      sel.selectAll('text').style('fill', 'var(--mc-text-secondary)').attr('font-size', 10);
    });

    g.append('text')
      .attr('x', innerW / 2)
      .attr('y', lineH + 28)
      .attr('text-anchor', 'middle')
      .style('fill', 'var(--mc-text-muted)')
      .attr('font-size', 10)
      .text(labels.axisTimeCaption);

    const axisY = d3.axisLeft(y).ticks(5).tickFormat(d3.format('.2f'));
    g.append('g')
      .call(axisY)
      .call((sel) => {
        sel.selectAll('path,line').style('stroke', 'var(--mc-border-subtle)');
        sel.selectAll('text').style('fill', 'var(--mc-text-secondary)').attr('font-size', 10);
      });

    const yLabel =
      metric === 'stability' ? labels.axisStability : labels.axisDifficulty;
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -34)
      .attr('x', -lineH / 2)
      .attr('text-anchor', 'middle')
      .style('fill', 'var(--mc-text-muted)')
      .attr('font-size', 10)
      .text(yLabel);

    /** Right-edge circled ? icons (LTM + last deck mean/median); values only in tooltips. */
    const endLab = g.append('g').attr('class', 'deck-overlay-end-labels');
    const fmtEnd = d3.format('.2f');
    const iconCx = innerW + 6 + HELP_ICON_R;
    const endItems: EndCapRow[] = [];
    if (metric === 'stability') {
      const ltmDays = STABILITY_LONG_TERM_GOAL_DAYS;
      endItems.push({
        y: y(ltmDays),
        strokeColor: 'var(--mc-accent-success)',
        tooltip: `${labels.stabilityLongTermGoalCaption}\n${ltmDays} d\n\n${labels.lineTooltipLtm}`,
      });
    }
    if (deckEvolution.length > 0) {
      const lastE = deckEvolution[deckEvolution.length - 1]!;
      endItems.push({
        y: y(lastE.mean),
        strokeColor: 'var(--mc-text-muted)',
        tooltip: `${labels.lineEndMeanCaption}: ${fmtEnd(lastE.mean)}\n\n${labels.lineTooltipMean}`,
      });
      endItems.push({
        y: y(lastE.median),
        strokeColor: 'var(--mc-accent-primary)',
        tooltip: `${labels.lineEndMedianCaption}: ${fmtEnd(lastE.median)}\n\n${labels.lineTooltipMedian}`,
      });
    }
    for (const it of packEndLabels(endItems, lineH)) {
      const iconG = endLab
        .append('g')
        .attr('class', 'deck-overlay-end-help-icon')
        .attr('transform', `translate(${iconCx},${it.y})`)
        .attr('role', 'img')
        .attr('aria-label', `${labels.helpIconAria}: ${it.tooltip}`)
        .style('cursor', 'help');
      iconG.append('title').text(it.tooltip);
      appendLucideCircleQuestionHelp(iconG, it.strokeColor);
    }

    /** Invisible overlay for nearest-point tooltip */
    const flatPoints = seriesList.flatMap((s) =>
      s.points.map((p) => ({
        px: xTime(new Date(p.tMs)),
        py: y(p.y),
        cardId: s.cardId,
        recto: s.recto,
        log: p.log,
        color: s.color,
      }))
    );

    g.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', innerW)
      .attr('height', lineH)
      .attr('fill', 'transparent')
      .style('cursor', 'crosshair')
      .on('mousemove', function (ev: MouseEvent) {
        const [mx, my] = d3.pointer(ev, this);
        let best: (typeof flatPoints)[0] | null = null;
        let bestD = Infinity;
        for (const p of flatPoints) {
          const dx = p.px - mx;
          const dy = p.py - my;
          const d2 = dx * dx + dy * dy;
          if (d2 < bestD) {
            bestD = d2;
            best = p;
          }
        }
        if (!best || bestD > 28 * 28) {
          setTip(null);
          return;
        }
        const rect = wrapRef.current?.getBoundingClientRect();
        if (!rect) return;
        const preview = previewCardRecto(best.recto ?? '', 72);
        const val =
          metric === 'stability' ? best.log.stability_after : best.log.difficulty_after;
        const valTxt = val != null && Number.isFinite(val) ? val.toFixed(2) : '—';
        const text = [
          preview,
          formatEventTime(best.log.review_time, locale),
          ...(ratingLabel ? [ratingLabel(best.log.rating)] : []),
          `${yLabel}: ${valTxt}`,
        ].join('\n');
        setTip({ x: ev.clientX - rect.left, y: ev.clientY - rect.top, text });
      })
      .on('mouseleave', () => setTip(null));

    return () => setTip(null);
  }, [
    seriesList,
    chartTotalWidth,
    innerW,
    lineH,
    locale,
    labels.axisStability,
    labels.axisDifficulty,
    labels.axisTimeCaption,
    labels.stabilityLongTermGoalCaption,
    labels.aggregateMeanCaption,
    labels.aggregateMedianCaption,
    labels.lineEndMeanCaption,
    labels.lineEndMedianCaption,
    labels.lineTooltipLtm,
    labels.lineTooltipMean,
    labels.lineTooltipMedian,
    labels.helpIconAria,
    deckEvolution,
    metric,
    padT,
    spanT,
    tMax,
    tMin,
    yExtent.max,
    yExtent.min,
    ratingLabel,
    ratingMarkerMode,
  ]);

  if (cards.length === 0) return null;

  return (
    <section
      className="rounded-lg border border-(--mc-border-subtle) bg-(--mc-bg-page) p-3"
      aria-labelledby={titleId}
    >
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <h4 id={titleId} className="text-sm font-medium text-(--mc-text-primary)">
          {labels.chartTitle}
        </h4>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
          <div className="flex gap-1 rounded-md border border-(--mc-border-subtle) bg-(--mc-bg-surface) p-0.5">
            <button
              type="button"
              className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                metric === 'stability'
                  ? 'bg-(--mc-bg-card-back) text-(--mc-text-primary)'
                  : 'text-(--mc-text-secondary) hover:text-(--mc-text-primary)'
              }`}
              aria-pressed={metric === 'stability'}
              onClick={() => setMetric('stability')}
            >
              {labels.metricStability}
            </button>
            <button
              type="button"
              className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                metric === 'difficulty'
                  ? 'bg-(--mc-bg-card-back) text-(--mc-text-primary)'
                  : 'text-(--mc-text-secondary) hover:text-(--mc-text-primary)'
              }`}
              aria-pressed={metric === 'difficulty'}
              onClick={() => setMetric('difficulty')}
            >
              {labels.metricDifficulty}
            </button>
          </div>
          <div
            className="flex gap-0.5 rounded-md border border-(--mc-border-subtle) bg-(--mc-bg-surface) p-0.5"
            role="group"
            aria-label={labels.ratingMarkersModeGroup}
          >
            {(['visible', 'faded', 'hidden'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                className={`rounded px-1.5 py-1 text-[11px] font-medium transition-colors sm:px-2 sm:text-xs ${
                  ratingMarkerMode === mode
                    ? 'bg-(--mc-bg-card-back) text-(--mc-text-primary)'
                    : 'text-(--mc-text-secondary) hover:text-(--mc-text-primary)'
                }`}
                aria-pressed={ratingMarkerMode === mode}
                onClick={() => setRatingMarkerMode(mode)}
              >
                {mode === 'visible'
                  ? labels.ratingMarkersSolid
                  : mode === 'faded'
                    ? labels.ratingMarkersFaded
                    : labels.ratingMarkersHidden}
              </button>
            ))}
          </div>
        </div>
      </div>
      <p className="mb-2 text-[11px] text-(--mc-text-muted)">{labels.hoverHint}</p>
      {seriesList.length === 0 ? (
        <p className="text-sm text-(--mc-text-muted)">{labels.emptyMetric}</p>
      ) : (
        <div
          ref={scrollRef}
          className="w-full max-w-full overflow-x-auto overflow-y-hidden overscroll-x-contain"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div ref={wrapRef} className="relative" style={{ width: chartTotalWidth, minWidth: '100%' }}>
            <svg
              ref={svgRef}
              className="block max-w-none shrink-0"
              width={chartTotalWidth}
              height={CHART_HEIGHT}
              aria-hidden
            />
            {tip && (
              <div
                className="pointer-events-none absolute z-10 max-w-[min(100%,260px)] rounded-md border border-(--mc-border-subtle) bg-(--mc-bg-surface) px-2 py-1.5 text-[11px] text-(--mc-text-primary) shadow-lg whitespace-pre-line"
                style={{
                  left: Math.min(chartTotalWidth - 200, Math.max(8, tip.x + 12)),
                  top: Math.min(CHART_HEIGHT - 88, Math.max(8, tip.y + 12)),
                }}
              >
                {tip.text}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
