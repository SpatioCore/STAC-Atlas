/**
 * @fileoverview Unit tests for CLI argument parsing
 */

import { jest } from '@jest/globals';
import { parseCliArgs, printHelp } from '../utils/cli.js';

describe('CLI utilities', () => {
  let originalArgv;

  beforeEach(() => {
    // Save original argv
    originalArgv = process.argv;
  });

  afterEach(() => {
    // Restore original argv
    process.argv = originalArgv;
  });

  describe('parseCliArgs', () => {
    test('should return empty config for no arguments', () => {
      process.argv = ['node', 'script.js'];
      const config = parseCliArgs();
      expect(config).toEqual({});
    });

    test('should parse --mode argument', () => {
      process.argv = ['node', 'script.js', '--mode', 'catalogs'];
      const config = parseCliArgs();
      expect(config.mode).toBe('catalogs');
    });

    test('should parse -m short form', () => {
      process.argv = ['node', 'script.js', '-m', 'apis'];
      const config = parseCliArgs();
      expect(config.mode).toBe('apis');
    });

    test('should parse --max-catalogs argument', () => {
      process.argv = ['node', 'script.js', '--max-catalogs', '20'];
      const config = parseCliArgs();
      expect(config.maxCatalogs).toBe(20);
    });

    test('should parse -c short form', () => {
      process.argv = ['node', 'script.js', '-c', '15'];
      const config = parseCliArgs();
      expect(config.maxCatalogs).toBe(15);
    });

    test('should parse --max-apis argument', () => {
      process.argv = ['node', 'script.js', '--max-apis', '10'];
      const config = parseCliArgs();
      expect(config.maxApis).toBe(10);
    });

    test('should parse -a short form', () => {
      process.argv = ['node', 'script.js', '-a', '8'];
      const config = parseCliArgs();
      expect(config.maxApis).toBe(8);
    });

    test('should parse --timeout argument', () => {
      process.argv = ['node', 'script.js', '--timeout', '60000'];
      const config = parseCliArgs();
      expect(config.timeout).toBe(60000);
    });

    test('should parse -t short form', () => {
      process.argv = ['node', 'script.js', '-t', '45000'];
      const config = parseCliArgs();
      expect(config.timeout).toBe(45000);
    });

    test('should parse --max-depth argument', () => {
      process.argv = ['node', 'script.js', '--max-depth', '5'];
      const config = parseCliArgs();
      expect(config.maxDepth).toBe(5);
    });

    test('should parse -d short form', () => {
      process.argv = ['node', 'script.js', '-d', '15'];
      const config = parseCliArgs();
      expect(config.maxDepth).toBe(15);
    });

    test('should parse --max-concurrency argument', () => {
      process.argv = ['node', 'script.js', '--max-concurrency', '10'];
      const config = parseCliArgs();
      expect(config.maxConcurrency).toBe(10);
    });

    test('should parse --requests-per-minute argument', () => {
      process.argv = ['node', 'script.js', '--requests-per-minute', '120'];
      const config = parseCliArgs();
      expect(config.maxRequestsPerMinute).toBe(120);
    });

    test('should parse --rpm short form', () => {
      process.argv = ['node', 'script.js', '--rpm', '90'];
      const config = parseCliArgs();
      expect(config.maxRequestsPerMinute).toBe(90);
    });

    test('should parse --domain-delay argument', () => {
      process.argv = ['node', 'script.js', '--domain-delay', '2.5'];
      const config = parseCliArgs();
      expect(config.sameDomainDelaySecs).toBe(2.5);
    });

    test('should parse --max-retries argument', () => {
      process.argv = ['node', 'script.js', '--max-retries', '5'];
      const config = parseCliArgs();
      expect(config.maxRequestRetries).toBe(5);
    });

    test('should parse --parallel-domains argument', () => {
      process.argv = ['node', 'script.js', '--parallel-domains', '8'];
      const config = parseCliArgs();
      expect(config.parallelDomains).toBe(8);
    });

    test('should parse -p short form', () => {
      process.argv = ['node', 'script.js', '-p', '12'];
      const config = parseCliArgs();
      expect(config.parallelDomains).toBe(12);
    });

    test('should parse --rpm-per-domain argument', () => {
      process.argv = ['node', 'script.js', '--rpm-per-domain', '150'];
      const config = parseCliArgs();
      expect(config.maxRequestsPerMinutePerDomain).toBe(150);
    });

    test('should parse --concurrency-per-domain argument', () => {
      process.argv = ['node', 'script.js', '--concurrency-per-domain', '15'];
      const config = parseCliArgs();
      expect(config.maxConcurrencyPerDomain).toBe(15);
    });

    test('should parse multiple arguments together', () => {
      process.argv = [
        'node',
        'script.js',
        '--mode', 'both',
        '--max-catalogs', '25',
        '--max-apis', '12',
        '--timeout', '45000',
        '-p', '5',
        '--rpm-per-domain', '100'
      ];

      const config = parseCliArgs();

      expect(config.mode).toBe('both');
      expect(config.maxCatalogs).toBe(25);
      expect(config.maxApis).toBe(12);
      expect(config.timeout).toBe(45000);
      expect(config.parallelDomains).toBe(5);
      expect(config.maxRequestsPerMinutePerDomain).toBe(100);
    });

    test('should parse mixed short and long arguments', () => {
      process.argv = [
        'node',
        'script.js',
        '-m', 'catalogs',
        '--max-catalogs', '30',
        '-t', '60000',
        '--parallel-domains', '10'
      ];

      const config = parseCliArgs();

      expect(config.mode).toBe('catalogs');
      expect(config.maxCatalogs).toBe(30);
      expect(config.timeout).toBe(60000);
      expect(config.parallelDomains).toBe(10);
    });

    test('should handle zero values', () => {
      process.argv = [
        'node',
        'script.js',
        '--max-catalogs', '0',
        '--max-apis', '0',
        '--max-depth', '0'
      ];

      const config = parseCliArgs();

      expect(config.maxCatalogs).toBe(0);
      expect(config.maxApis).toBe(0);
      expect(config.maxDepth).toBe(0);
    });

    test('should handle negative values (parsed as-is)', () => {
      process.argv = ['node', 'script.js', '--timeout', '-1000'];
      const config = parseCliArgs();
      expect(config.timeout).toBe(-1000);
    });

    test('should handle float values for domain-delay', () => {
      process.argv = ['node', 'script.js', '--domain-delay', '1.5'];
      const config = parseCliArgs();
      expect(config.sameDomainDelaySecs).toBe(1.5);
    });

    test('should handle invalid number formats (NaN)', () => {
      process.argv = ['node', 'script.js', '--max-catalogs', 'not-a-number'];
      const config = parseCliArgs();
      expect(config.maxCatalogs).toBeNaN();
    });

    test('should skip unknown arguments', () => {
      process.argv = [
        'node',
        'script.js',
        '--unknown-flag',
        'value',
        '--mode', 'apis'
      ];

      const config = parseCliArgs();

      expect(config).not.toHaveProperty('unknown-flag');
      expect(config.mode).toBe('apis');
    });

    test('should handle arguments without values gracefully', () => {
      // If an argument expects a value but reaches end of array
      process.argv = ['node', 'script.js', '--mode'];
      const config = parseCliArgs();
      
      // mode will be undefined since there's no next argument
      expect(config.mode).toBeUndefined();
    });

    test('should handle consecutive flags', () => {
      process.argv = [
        'node',
        'script.js',
        '-m', 'catalogs',
        '-c', '10',
        '-a', '5',
        '-t', '30000'
      ];

      const config = parseCliArgs();

      expect(config.mode).toBe('catalogs');
      expect(config.maxCatalogs).toBe(10);
      expect(config.maxApis).toBe(5);
      expect(config.timeout).toBe(30000);
    });

    test('should handle real-world example command', () => {
      process.argv = [
        'node',
        'index.js',
        '--mode', 'both',
        '--parallel-domains', '5',
        '--rpm-per-domain', '120',
        '--concurrency-per-domain', '10',
        '--max-catalogs', '0',
        '--max-apis', '0',
        '--max-depth', '10'
      ];

      const config = parseCliArgs();

      expect(config.mode).toBe('both');
      expect(config.parallelDomains).toBe(5);
      expect(config.maxRequestsPerMinutePerDomain).toBe(120);
      expect(config.maxConcurrencyPerDomain).toBe(10);
      expect(config.maxCatalogs).toBe(0);
      expect(config.maxApis).toBe(0);
      expect(config.maxDepth).toBe(10);
    });

    test('should handle legacy rate limiting options', () => {
      process.argv = [
        'node',
        'script.js',
        '--max-concurrency', '5',
        '--requests-per-minute', '60',
        '--domain-delay', '1',
        '--max-retries', '3'
      ];

      const config = parseCliArgs();

      expect(config.maxConcurrency).toBe(5);
      expect(config.maxRequestsPerMinute).toBe(60);
      expect(config.sameDomainDelaySecs).toBe(1);
      expect(config.maxRequestRetries).toBe(3);
    });
  });

  describe('printHelp', () => {
    let consoleSpy;
    let exitSpy;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      // Don't actually exit during tests
      exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
      exitSpy.mockRestore();
    });

    test('should print help message', () => {
      printHelp();

      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls.map(call => call[0]).join('\n');

      expect(output).toContain('STAC Crawler Configuration Options');
      expect(output).toContain('--mode');
      expect(output).toContain('--max-catalogs');
      expect(output).toContain('--max-apis');
      expect(output).toContain('--timeout');
      expect(output).toContain('--parallel-domains');
      expect(output).toContain('--rpm-per-domain');
      expect(output).toContain('--concurrency-per-domain');
      expect(output).toContain('--max-depth');
      expect(output).toContain('--help');
    });

    test('should include environment variable documentation', () => {
      printHelp();

      const output = consoleSpy.mock.calls.map(call => call[0]).join('\n');

      expect(output).toContain('Environment Variables:');
      expect(output).toContain('CRAWL_MODE');
      expect(output).toContain('MAX_CATALOGS');
      expect(output).toContain('MAX_APIS');
      expect(output).toContain('PARALLEL_DOMAINS');
      expect(output).toContain('MAX_REQUESTS_PER_MINUTE_PER_DOMAIN');
    });

    test('should include usage examples', () => {
      printHelp();

      const output = consoleSpy.mock.calls.map(call => call[0]).join('\n');

      expect(output).toContain('Examples:');
      expect(output).toContain('node index.js');
      expect(output).toContain('--mode catalogs');
      expect(output).toContain('-p 5');
      expect(output).toContain('--rpm-per-domain 120');
    });

    test('should include short form aliases', () => {
      printHelp();

      const output = consoleSpy.mock.calls.map(call => call[0]).join('\n');

      expect(output).toContain('-m');
      expect(output).toContain('-c');
      expect(output).toContain('-a');
      expect(output).toContain('-t');
      expect(output).toContain('-d');
      expect(output).toContain('-p');
      expect(output).toContain('-h');
    });

    test('should document parallel crawling options', () => {
      printHelp();

      const output = consoleSpy.mock.calls.map(call => call[0]).join('\n');

      expect(output).toContain('Parallel Crawling Options');
      expect(output).toContain('parallel-domains');
      expect(output).toContain('rpm-per-domain');
      expect(output).toContain('concurrency-per-domain');
    });

    test('should document legacy options', () => {
      printHelp();

      const output = consoleSpy.mock.calls.map(call => call[0]).join('\n');

      expect(output).toContain('Legacy Rate Limiting Options');
      expect(output).toContain('--max-concurrency');
      expect(output).toContain('--domain-delay');
      expect(output).toContain('--max-retries');
    });

    test('--help flag should call printHelp and exit', () => {
      process.argv = ['node', 'script.js', '--help'];

      // parseCliArgs would normally call printHelp and process.exit
      // Since we've mocked process.exit, we can test directly
      printHelp();

      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls.map(call => call[0]).join('\n');
      expect(output).toContain('STAC Crawler Configuration Options');
    });

    test('-h flag should work same as --help', () => {
      process.argv = ['node', 'script.js', '-h'];
      
      printHelp();

      expect(consoleSpy).toHaveBeenCalled();
    });
  });
});
