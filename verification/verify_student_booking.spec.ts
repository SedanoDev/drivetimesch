import { test, expect } from '@playwright/test';

test('Verify Student Booking Page', async ({ page }) => {
  // 1. Go to Login Page
  await page.goto('http://localhost:5173/login');

  // 2. Login as Student
  await page.fill('input[type="email"]', 'alumno@demo.com');
  await page.fill('input[type="password"]', '123456');
  await page.click('button[type="submit"]');

  // Wait for navigation
  await page.waitForTimeout(3000);

  // Navigate to booking page
  await page.goto('http://localhost:5173/student/book');

  // Wait for selector
  await page.waitForSelector('h1', { timeout: 10000 });

  // Check title
  await expect(page.locator('h1')).toContainText('Nueva Reserva');

  // Take screenshot
  await page.screenshot({ path: 'verification/student_booking_page.png', fullPage: true });
});
