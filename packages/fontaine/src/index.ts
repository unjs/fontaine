/**
 * @typedef {Object} FallbackOptions
 * @property {string} fontName The main font name to fallback from.
 * @property {number} [minFontSize=10] The minimum font size to ensure readability.
 * @property {number} [maxFontSize=100] The maximum font size to limit fallback scaling.
 */

import { generateMetricsCSS } from './metrics';
import { generateFallbackCSS } from './fallbacks';
import { transformTextMetrics } from './transform';
import { parseCSS } from './css/parse';
import { renderCSS } from './css/render';
import { calculateFallback } from './utils';

/**
 * @type {import('./utils').FontainOptions}
 */
export const defaultOptions = {};

/**
 * Generates necessary CSS metrics for font optimization and fallback calculation.
 * This function is primarily used internally but is exposed for programmatic access.
 * @param {Object} options Options for metric generation.
 * @returns {string} CSS metrics string.
 */
export const generateFontMetrics = (options) => {
    return generateMetricsCSS(options);
};

/**
 * Calculates and generates CSS fallback rules for a given font name.
 * @param {string} fontName The name of the primary font.
 * @param {FallbackOptions} [options] Options governing the fallback process.
 * @returns {string} The CSS fallback rules.
 */
export const generateFallbackCSS = (fontName, options) => {
    return generateFallbackCSS(fontName, options);
};

/**
 * Transforms font metrics to a standard scale, useful for runtime or build-time calculations.
 * @param {string} text The text input to measure.
 * @param {Object} options Options for transformation.
 * @returns {number} The scaled metric value.
 */
export const transformTextMetrics = (text, options) => {
    return transformTextMetrics(text, options);
};

/**
 * Parses CSS strings into structured objects for manipulation.
 * @type {typeof parseCSS}
 */
export const parse = parseCSS;

/**
 * Renders structured objects back into CSS strings.
 * @type {typeof renderCSS}
 */
export const render = renderCSS;

/**
 * Utility function to calculate fallback values.
 * @type {typeof calculateFallback}
 */
export const calculateFallback = calculateFallback;

export {
    defaultOptions,
    parse,
    render
};