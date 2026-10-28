import puppeteer, { Browser, Page, PDFOptions } from "puppeteer";

/**
 * ============================================================================
 * PRODUCTION PUPPETEER BROWSER POOL & CONCURRENCY CONTROLLER
 * ============================================================================
 * Solves Bug 4.3: Puppeteer / Headless Chrome Memory Leak on Bulk PDF Generation.
 * Replaces per-request `puppeteer.launch()` with a managed singleton Chromium instance
 * and tab recycling pool with a hard concurrency ceiling (default: 4 concurrent pages).
 */
class PuppeteerBrowserPool {
  private browser: Browser | null = null;
  private isLaunching = false;
  private maxConcurrentPages = Number(process.env.PDF_CONCURRENCY_LIMIT || 4);
  private activePageCount = 0;
  private queue: Array<() => void> = [];

  private async getBrowser(): Promise<Browser> {
    if (this.browser && this.browser.connected) {
      return this.browser;
    }

    if (this.isLaunching) {
      // Wait for concurrent launch
      while (this.isLaunching) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      if (this.browser && this.browser.connected) {
        return this.browser;
      }
    }

    this.isLaunching = true;
    try {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--disable-extensions",
          "--no-first-run",
          "--no-zygote",
          "--single-process",
          "--font-render-hinting=none",
        ],
      });

      this.browser.on("disconnected", () => {
        console.warn("[Puppeteer Pool] Chromium disconnected. Resetting browser instance.");
        this.browser = null;
      });

      console.log("[Puppeteer Pool] Singleton Chromium instance launched successfully.");
      return this.browser;
    } finally {
      this.isLaunching = false;
    }
  }

  private async acquireSemaphore(): Promise<void> {
    if (this.activePageCount < this.maxConcurrentPages) {
      this.activePageCount++;
      return;
    }

    await new Promise<void>((resolve) => {
      this.queue.push(() => {
        this.activePageCount++;
        resolve();
      });
    });
  }

  private releaseSemaphore(): void {
    this.activePageCount = Math.max(0, this.activePageCount - 1);
    if (this.queue.length > 0) {
      const nextInQueue = this.queue.shift();
      if (nextInQueue) nextInQueue();
    }
  }

  /**
   * Executes a page rendering action with automatic page acquisition, lifecycle recycling,
   * and strict concurrency throttling.
   */
  public async renderWithPage<T>(fn: (page: Page) => Promise<T>): Promise<T> {
    await this.acquireSemaphore();
    let page: Page | null = null;

    try {
      const browser = await this.getBrowser();
      page = await browser.newPage();

      // Optimize page resource loading: block images/fonts if needed or set strict timeouts
      await page.setRequestInterception(false);
      return await fn(page);
    } catch (err: any) {
      console.error("[Puppeteer Pool] Error during page execution:", err?.message);
      throw err;
    } finally {
      if (page) {
        try {
          await page.close();
        } catch {
          // Ignore close errors
        }
      }
      this.releaseSemaphore();
    }
  }

  /**
   * Generates PDF buffer from HTML string with zero memory leaks.
   */
  public async htmlToPdf(html: string, options: PDFOptions): Promise<Buffer> {
    return this.renderWithPage(async (page) => {
      await page.setContent(html, {
        waitUntil: "networkidle0",
        timeout: 30000,
      });

      const pdfUint8Array = await page.pdf(options);
      return Buffer.from(pdfUint8Array);
    });
  }

  /**
   * Graceful shutdown of the Chromium instance.
   */
  public async closePool(): Promise<void> {
    if (this.browser) {
      try {
        await this.browser.close();
      } catch {
        // Ignore close errors
      }
      this.browser = null;
    }
  }
}

export const puppeteerBrowserPool = new PuppeteerBrowserPool();
export default puppeteerBrowserPool;
