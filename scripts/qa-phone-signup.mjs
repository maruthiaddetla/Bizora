import { chromium } from "playwright";

const VIEWPORTS = [
  { name: "390x844", width: 390, height: 844 },
  { name: "768x1024", width: 768, height: 1024 },
  { name: "1024x768", width: 1024, height: 768 },
  { name: "1440x900", width: 1440, height: 900 },
];

async function run() {
  const browser = await chromium.launch({
    headless: true,
    channel: "chrome",
  });
  const results = [];

  for (const vp of VIEWPORTS) {
    const page = await browser.newPage({
      viewport: { width: vp.width, height: vp.height },
    });
    const entry = { viewport: vp.name, steps: {} };

    try {
      await page.goto("http://localhost:3000/sign-up", {
        waitUntil: "networkidle",
      });
      entry.steps.signUpLoaded = await page
        .getByText("Mobile number", { exact: true })
        .isVisible();

      await page
        .locator('input[type="tel"], input[inputmode="numeric"]')
        .first()
        .fill("9876543210");
      await page.getByRole("button", { name: "Continue", exact: true }).click();
      await page.getByText("Create password").waitFor({ timeout: 10000 });
      entry.steps.passwordStep = true;

      await page.locator('input[type="password"]').nth(0).fill("TestPass123!");
      await page.locator('input[type="password"]').nth(1).fill("TestPass123!");
      await page.getByRole("button", { name: "Continue", exact: true }).click();

      await page.waitForTimeout(5000);
      const body = await page.locator("body").innerText();
      const onOtp = body.includes("Verify your mobile number");
      const hasSendError =
        body.includes("verification code") ||
        body.includes("Something went wrong") ||
        body.includes("already registered");
      entry.steps.onOtpScreen = onOtp;
      entry.steps.sendErrorShown = hasSendError && !onOtp;
      entry.steps.reachedOtpOrError = onOtp || hasSendError;

      if (onOtp) {
        await page.locator("input").last().fill("000000");
        await page.getByRole("button", { name: "Verify" }).click();
        await page.waitForTimeout(2500);
        const after = await page.locator("body").innerText();
        entry.steps.invalidOtpHandled =
          after.toLowerCase().includes("incorrect") ||
          after.toLowerCase().includes("expired") ||
          after.toLowerCase().includes("try again");
        entry.steps.resendVisible =
          after.includes("Resend OTP") || after.includes("Resend OTP in");
      }

      await page.goto("http://localhost:3000/sign-in", {
        waitUntil: "networkidle",
      });
      entry.steps.signInHasNoSendOtp = !(await page
        .getByRole("button", { name: /Send OTP/i })
        .isVisible()
        .catch(() => false));

      entry.ok =
        entry.steps.signUpLoaded &&
        entry.steps.passwordStep &&
        entry.steps.reachedOtpOrError &&
        entry.steps.signInHasNoSendOtp;
    } catch (error) {
      entry.ok = false;
      entry.error = String(error).slice(0, 300);
    }

    results.push(entry);
    await page.close();
  }

  await browser.close();
  console.log(JSON.stringify(results, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
