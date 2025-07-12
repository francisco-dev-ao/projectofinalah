# Test info

- Name: verifica se a página carrega corretamente
- Location: C:\Users\AH\OneDrive - Angohost\Imagens\AV3.0Ex\tests\example.spec.ts:3:1

# Error details

```
Error: browserType.launch: Executable doesn't exist at C:\Users\AH\AppData\Local\ms-playwright\chromium_headless_shell-1169\chrome-win\headless_shell.exe
╔═════════════════════════════════════════════════════════════════════════╗
║ Looks like Playwright Test or Playwright was just installed or updated. ║
║ Please run the following command to download new browsers:              ║
║                                                                         ║
║     npx playwright install                                              ║
║                                                                         ║
║ <3 Playwright Team                                                      ║
╚═════════════════════════════════════════════════════════════════════════╝
```

# Test source

```ts
  1 | import { test, expect } from '@playwright/test';
  2 |
> 3 | test('verifica se a página carrega corretamente', async ({ page }) => {
    | ^ Error: browserType.launch: Executable doesn't exist at C:\Users\AH\AppData\Local\ms-playwright\chromium_headless_shell-1169\chrome-win\headless_shell.exe
  4 |     await page.goto('https://example.com');
  5 |     await expect(page).toHaveTitle(/Example Domain/);
  6 | });
```