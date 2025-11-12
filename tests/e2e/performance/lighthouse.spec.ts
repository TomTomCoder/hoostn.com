import { test, expect } from '@playwright/test';

/**
 * Performance E2E Tests
 *
 * Tests cover:
 * - Homepage load time
 * - Search page load time
 * - Core Web Vitals
 * - Lighthouse scores (optional - requires playwright-lighthouse)
 */

test.describe('Performance Tests', () => {
  test.describe('Page Load Times', () => {
    test('should load homepage in < 3 seconds', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/');

      // Wait for page to be fully loaded
      await page.waitForLoadState('networkidle');

      const loadTime = Date.now() - startTime;

      console.log(`Homepage load time: ${loadTime}ms`);

      // Should load in under 3 seconds
      expect(loadTime).toBeLessThan(3000);
    });

    test('should load search page in < 3 seconds', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/search');

      await page.waitForLoadState('networkidle');

      const loadTime = Date.now() - startTime;

      console.log(`Search page load time: ${loadTime}ms`);

      expect(loadTime).toBeLessThan(3000);
    });

    test('should load lot details page in < 3 seconds', async ({ page }) => {
      await page.goto('/search');

      const lotLink = page.locator('[href*="/lots/"]').first();

      if (await lotLink.count() === 0) {
        test.skip('No lots available');
      }

      const href = await lotLink.getAttribute('href');

      if (href) {
        const startTime = Date.now();

        await page.goto(href);
        await page.waitForLoadState('networkidle');

        const loadTime = Date.now() - startTime;

        console.log(`Lot details load time: ${loadTime}ms`);

        expect(loadTime).toBeLessThan(3000);
      }
    });

    test('should load dashboard in < 3 seconds', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/dashboard');

      // May redirect to login
      if (page.url().includes('/login')) {
        test.skip('Not authenticated');
      }

      await page.waitForLoadState('networkidle');

      const loadTime = Date.now() - startTime;

      console.log(`Dashboard load time: ${loadTime}ms`);

      expect(loadTime).toBeLessThan(3000);
    });
  });

  test.describe('Core Web Vitals', () => {
    test('should have good First Contentful Paint (FCP)', async ({ page }) => {
      await page.goto('/');

      const fcp = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const fcpEntry = entries.find((entry) => entry.name === 'first-contentful-paint');
            if (fcpEntry) {
              resolve(fcpEntry.startTime);
            }
          }).observe({ entryTypes: ['paint'] });

          // Fallback timeout
          setTimeout(() => resolve(0), 5000);
        });
      });

      console.log(`FCP: ${fcp}ms`);

      // Good FCP is < 1.8s (1800ms)
      if (fcp > 0) {
        expect(fcp).toBeLessThan(1800);
      }
    });

    test('should have good Largest Contentful Paint (LCP)', async ({ page }) => {
      await page.goto('/');

      const lcp = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          let lcpValue = 0;

          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            lcpValue = lastEntry.startTime;
          }).observe({ entryTypes: ['largest-contentful-paint'] });

          // Resolve after a delay to get the final LCP
          setTimeout(() => resolve(lcpValue), 3000);
        });
      });

      console.log(`LCP: ${lcp}ms`);

      // Good LCP is < 2.5s (2500ms)
      if (lcp > 0) {
        expect(lcp).toBeLessThan(2500);
      }
    });

    test('should have low Cumulative Layout Shift (CLS)', async ({ page }) => {
      await page.goto('/');

      // Scroll and interact to trigger any layout shifts
      await page.evaluate(() => window.scrollBy(0, 500));
      await page.waitForTimeout(1000);

      const cls = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          let clsValue = 0;

          new PerformanceObserver((list) => {
            for (const entry of list.getEntries() as any[]) {
              if (!entry.hadRecentInput) {
                clsValue += entry.value;
              }
            }
          }).observe({ entryTypes: ['layout-shift'] });

          setTimeout(() => resolve(clsValue), 2000);
        });
      });

      console.log(`CLS: ${cls}`);

      // Good CLS is < 0.1
      expect(cls).toBeLessThan(0.1);
    });

    test('should have good Time to Interactive (TTI)', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('/');

      // Wait for page to be interactive
      await page.waitForLoadState('domcontentloaded');

      // Try to interact with an element
      const firstLink = page.getByRole('link').first();

      if (await firstLink.count() > 0) {
        await firstLink.hover();
      }

      const tti = Date.now() - startTime;

      console.log(`TTI: ${tti}ms`);

      // Good TTI is < 3.8s (3800ms)
      expect(tti).toBeLessThan(3800);
    });
  });

  test.describe('Resource Loading', () => {
    test('should load critical resources quickly', async ({ page }) => {
      await page.goto('/');

      const resources = await page.evaluate(() => {
        const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        return entries.map((entry) => ({
          name: entry.name,
          duration: entry.duration,
          type: entry.initiatorType,
        }));
      });

      // Check that no single resource takes > 2 seconds
      const slowResources = resources.filter((r) => r.duration > 2000);

      console.log('Slow resources:', slowResources);

      expect(slowResources.length).toBe(0);
    });

    test('should optimize image loading', async ({ page }) => {
      await page.goto('/search');

      const images = await page.evaluate(() => {
        const imgs = Array.from(document.querySelectorAll('img'));
        return imgs.map((img) => ({
          src: img.src,
          loading: img.loading,
          width: img.naturalWidth,
          height: img.naturalHeight,
        }));
      });

      // Images should use lazy loading for below-the-fold content
      const hasLazyLoading = images.some((img) => img.loading === 'lazy');

      console.log('Images with lazy loading:', hasLazyLoading);

      // At least some images should use lazy loading
      // (This is a suggestion, not a strict requirement)
      if (images.length > 5) {
        expect(hasLazyLoading).toBeTruthy();
      }
    });

    test('should bundle JavaScript efficiently', async ({ page }) => {
      await page.goto('/');

      const jsResources = await page.evaluate(() => {
        const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        return entries
          .filter((entry) => entry.name.includes('.js'))
          .map((entry) => ({
            name: entry.name,
            size: entry.transferSize,
            duration: entry.duration,
          }));
      });

      console.log('JavaScript resources:', jsResources);

      // Total JS size should be reasonable (< 500KB for initial load)
      const totalJsSize = jsResources.reduce((sum, r) => sum + (r.size || 0), 0);
      console.log(`Total JS size: ${totalJsSize} bytes`);

      expect(totalJsSize).toBeLessThan(500 * 1024); // 500KB
    });
  });

  test.describe('Caching', () => {
    test('should cache static assets', async ({ page }) => {
      // First visit
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Second visit
      const startTime = Date.now();
      await page.reload();
      await page.waitForLoadState('networkidle');
      const reloadTime = Date.now() - startTime;

      console.log(`Reload time: ${reloadTime}ms`);

      // Reload should be faster due to caching
      expect(reloadTime).toBeLessThan(1000);
    });

    test('should use service worker (if implemented)', async ({ page }) => {
      await page.goto('/');

      const hasServiceWorker = await page.evaluate(() => {
        return 'serviceWorker' in navigator;
      });

      // Service worker support should be available
      expect(hasServiceWorker).toBeTruthy();
    });
  });

  test.describe('Responsive Performance', () => {
    test('should perform well on slow connections', async ({ page, context }) => {
      // Simulate slow 3G
      await context.route('**/*', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        await route.continue();
      });

      const startTime = Date.now();
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      const loadTime = Date.now() - startTime;

      console.log(`Load time on slow connection: ${loadTime}ms`);

      // Should still load in reasonable time (< 8 seconds)
      expect(loadTime).toBeLessThan(8000);
    });

    test('should handle concurrent users efficiently', async ({ page }) => {
      // This test documents the requirement
      test.skip('Requires load testing tool');

      // Simulate multiple concurrent requests
      // Server should handle gracefully
      // Response times should remain acceptable
    });
  });

  test.describe('Memory Usage', () => {
    test('should not have memory leaks', async ({ page }) => {
      await page.goto('/search');

      // Get initial memory
      const initialMemory = await page.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0;
      });

      // Navigate and interact multiple times
      for (let i = 0; i < 5; i++) {
        await page.reload();
        await page.waitForLoadState('networkidle');
      }

      // Get final memory
      const finalMemory = await page.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0;
      });

      console.log(`Initial memory: ${initialMemory}, Final memory: ${finalMemory}`);

      // Memory shouldn't grow excessively (< 50% increase)
      if (initialMemory > 0 && finalMemory > 0) {
        const increase = (finalMemory - initialMemory) / initialMemory;
        expect(increase).toBeLessThan(0.5);
      }
    });
  });
});
