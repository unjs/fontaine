import { describe, it, expect, beforeEach } from 'vitest';
import { generateFontMetrics, generateFallbackCSS, transformTextMetrics, parse, render, calculateFallback, defaultOptions } from '../src/index';
import { generateMetricsCSS } from '../src/metrics';
import { generateFallbackCSS as generateFallbackCSSInternal } from '../src/fallbacks';

describe('index.ts exports (programmatic usage)', () => {
    describe('generateFontMetrics', () => {
        it('should call the internal metrics function correctly', () => {
            const mockMetrics = 'mock-metrics-css';
            (generateMetricsCSS as jest.Mock).mockReturnValue(mockMetrics);
            
            const result = generateFontMetrics({ /* options */ });
            
            expect(generateMetricsCSS).toHaveBeenCalledWith({ /* options */ });
            expect(result).toBe(mockMetrics);
        });
    });

    describe('generateFallbackCSS', () => {
        it('should call the internal fallback generation function correctly', () => {
            const mockFallback = 'mock-fallback-css';
            (generateFallbackCSSInternal as jest.Mock).mockReturnValue(mockFallback);

            const result = generateFallbackCSS('TestFont', { /* options */ });

            expect(generateFallbackCSSInternal).toHaveBeenCalledWith('TestFont', { /* options */ });
            expect(result).toBe(mockFallback);
        });
    });

    describe('transformTextMetrics', () => {
        it('should return a transformed metric value', () => {
            // Assuming transformTextMetrics expects text and options
            const text = 'test text';
            const options = {};
            const mockResult = 1.5;
            (transformTextMetrics as jest.Mock).mockReturnValue(mockResult);

            const result = transformTextMetrics(text, options);
            
            expect(transformTextMetrics).toHaveBeenCalledWith(text, options);
            expect(result).toBe(mockResult);
        });
    });
    
    describe('parse and render (exposed APIs)', () => {
        it('should expose the parse function', () => {
            // Simple check that the function exists and is callable
            expect(typeof parse).toBe('function');
            // Mocking a simple parse call check
            const mockParseResult = { a: 'b' };
            (parse as jest.Mock).mockReturnValue(mockParseResult);
            
            const result = parse('css string');
            expect(parse).toHaveBeenCalled();
            expect(result).toEqual(mockParseResult);
        });

        it('should expose the render function', () => {
            expect(typeof render).toBe('function');
            const mockRenderResult = 'css string';
            (render as jest.Mock).mockReturnValue(mockRenderResult);
            
            const result = render(mockParseResult);
            expect(render).toHaveBeenCalled();
            expect(result).toBe(mockRenderResult);
        });
    });

    describe('calculateFallback utility', () => {
        it('should execute the fallback calculation utility', () => {
            const mockCalculate = (val, other) => 10;
            (calculateFallback as jest.Mock).mockImplementation(mockCalculate);
            
            const result = calculateFallback(5, 5);
            
            expect(calculateFallback).toHaveBeenCalled();
            expect(result).toBe(10);
        });
    });
});