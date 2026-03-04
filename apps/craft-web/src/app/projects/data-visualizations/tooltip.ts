import * as d3 from 'd3';

/**
 * A lightweight alias for the D3 tooltip selection type used throughout
 * the data visualization components. The generic parameters match the
 * interface returned by `d3.select(element).append('div')`.
 */
export type Tooltip = d3.Selection<HTMLDivElement, unknown, null, undefined>;

/**
 * Create a styled tooltip attached to `host` and optionally provide a
 * CSS class name. Any existing element with that class will be removed
 * first to avoid duplicates.
 */
export function createTooltip(host: HTMLElement, className = 'chart-tooltip'): Tooltip {
  d3.select(host).selectAll(`.${className}`).remove();
  return d3
    .select(host)
    .append('div')
    .attr('class', className)
    .style('opacity', 0)
    .style('position', 'absolute')
    .style('pointer-events', 'none')
    .style('z-index', '10');
}
