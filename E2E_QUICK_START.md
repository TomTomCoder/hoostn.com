# E2E Testing Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. Install & Setup
```bash
# Install dependencies (if not already done)
npm install

# Install Playwright browsers
npx playwright install
```

### 2. Start Development Server
```bash
# Terminal 1: Start the dev server
npm run dev
```

### 3. Run Tests
```bash
# Terminal 2: Run tests in UI mode (recommended for first time)
npm run test:e2e:ui

# Or run all tests headless
npm run test:e2e
```

---

## 📚 Common Commands

### Run Tests
```bash
npm run test:e2e              # Run all tests (headless)
npm run test:e2e:ui           # Run with UI (best for development)
npm run test:e2e:headed       # Run with browser visible
npm run test:e2e:debug        # Debug mode with step-through
```

### Run Specific Browsers
```bash
npm run test:e2e:chromium     # Chrome only
npm run test:e2e:firefox      # Firefox only
npm run test:e2e:webkit       # Safari only
npm run test:e2e:mobile       # Mobile devices
```

### Run Specific Tests
```bash
npx playwright test tests/e2e/auth/           # Authentication tests only
npx playwright test tests/e2e/properties/     # Property tests only
npx playwright test tests/e2e/booking/        # Booking tests only
```

### View Reports
```bash
npm run test:e2e:report       # Open HTML report
```

### Test Data
```bash
npm run test:seed             # Create test data
npm run test:cleanup          # Remove test data
```

---

## 🎯 Test File Locations

```
tests/e2e/
├── auth/                     # Authentication tests
│   └── authentication.spec.ts
├── properties/               # Property management tests
│   └── property-crud.spec.ts
├── lots/                     # Lot management tests
│   └── lot-crud.spec.ts
├── booking/                  # Public booking tests
│   └── public-booking.spec.ts
├── reservations/             # Reservation management tests
│   └── reservation-management.spec.ts
├── calendar/                 # Calendar & availability tests
│   └── availability.spec.ts
├── mobile/                   # Mobile responsive tests
│   └── mobile-responsive.spec.ts
├── errors/                   # Error handling tests
│   └── error-handling.spec.ts
├── performance/              # Performance tests
│   └── lighthouse.spec.ts
├── fixtures/                 # Test fixtures
│   ├── authenticated-user.ts
│   └── test-data.ts
├── utils/                    # Test utilities
│   └── helpers.ts
└── setup/                    # Test data management
    ├── seed-test-data.ts
    └── cleanup-test-data.ts
```

---

## 💡 Quick Tips

### Writing Tests
```typescript
import { test, expect } from '@playwright/test';

test('my test', async ({ page }) => {
  // Navigate
  await page.goto('/search');

  // Interact
  await page.getByLabel('Email').fill('test@example.com');
  await page.getByRole('button', { name: 'Submit' }).click();

  // Assert
  await expect(page.getByText('Success')).toBeVisible();
});
```

### Using Helpers
```typescript
import { fillForm, waitForToast } from '../utils/helpers';

// Fill multiple fields at once
await fillForm(page, {
  'Email': 'test@example.com',
  'Name': 'John Doe'
});

// Wait for notification
await waitForToast(page, 'Successfully saved');
```

### Adding data-testid
```tsx
// In your React components
<button data-testid="submit-button">Submit</button>

// In your test
await page.getByTestId('submit-button').click();
```

---

## 🔍 Debugging Tests

### UI Mode (Best for Debugging)
```bash
npm run test:e2e:ui
```
- See tests as they run
- Time-travel through steps
- View screenshots
- Inspect DOM

### Debug Mode
```bash
npm run test:e2e:debug
```
- Step through tests
- Use browser DevTools
- Set breakpoints

### Headed Mode
```bash
npm run test:e2e:headed
```
- See browser while tests run
- Good for visual debugging

---

## ⚡ Test Data

### Create Test Data Before Testing
```bash
npm run test:seed
```

This creates:
- Test organization
- Test users (owner, admin, employee)
- Test properties
- Test lots
- Test reservations

### Test Credentials
```
Owner:    test-owner@hoostn.com / TestPassword123!
Admin:    test-admin@hoostn.com / TestPassword123!
Employee: test-employee@hoostn.com / TestPassword123!
```

### Clean Up After Testing
```bash
npm run test:cleanup
```

---

## 📊 Understanding Test Results

### Console Output
```
  ✓ test name                                (1.2s)
  ✗ failed test                              (0.8s)
  ○ skipped test
```

### HTML Report
```bash
npm run test:e2e:report
```
- Visual report with screenshots
- Error details
- Test duration
- Failure screenshots

---

## 🐛 Common Issues

### "localhost:3000 not accessible"
**Solution:** Start dev server first
```bash
npm run dev
```

### "No test data found"
**Solution:** Seed test data
```bash
npm run test:seed
```

### "Timeout waiting for..."
**Solutions:**
- Increase timeout in test
- Check if element selector is correct
- Verify element is visible on page

### Tests pass locally but fail in CI
**Common causes:**
- Missing environment variables
- Different timing/performance
- Test data not seeded
- Browser differences

---

## 📝 Writing Your First Test

### 1. Create Test File
```bash
# Create file in appropriate directory
touch tests/e2e/my-feature/my-test.spec.ts
```

### 2. Write Test
```typescript
import { test, expect } from '@playwright/test';

test.describe('My Feature', () => {
  test('should do something', async ({ page }) => {
    // Navigate to page
    await page.goto('/my-page');

    // Interact with elements
    await page.getByLabel('Input').fill('value');
    await page.getByRole('button', { name: 'Submit' }).click();

    // Verify result
    await expect(page.getByText('Success')).toBeVisible();
  });
});
```

### 3. Run Your Test
```bash
npx playwright test tests/e2e/my-feature/my-test.spec.ts
```

---

## 🎓 Learn More

### Essential Playwright Concepts
- **Locators:** Find elements on page (`getByRole`, `getByLabel`, `getByTestId`)
- **Actions:** Interact with elements (`click`, `fill`, `check`)
- **Assertions:** Verify expectations (`toBeVisible`, `toHaveText`)
- **Navigation:** Move between pages (`goto`, `waitForURL`)

### Best Practices
1. Use semantic locators (role, label) over CSS selectors
2. Wait for elements properly (no arbitrary `waitForTimeout`)
3. Keep tests independent and atomic
4. Use data-testid for dynamic content
5. Clean up test data after tests

### Resources
- [Playwright Docs](https://playwright.dev)
- [E2E_TEST_SUITE_SUMMARY.md](./E2E_TEST_SUITE_SUMMARY.md) - Full documentation
- [TESTING_STRATEGY.md](./TESTING_STRATEGY.md) - Testing strategy

---

## ✅ Checklist for New Tests

- [ ] Test file created in correct directory
- [ ] Test has descriptive name
- [ ] Uses proper locators (semantic when possible)
- [ ] Includes proper assertions
- [ ] Cleans up test data
- [ ] Passes on all browsers
- [ ] Documented in code comments

---

**Happy Testing! 🎉**

For detailed documentation, see: [E2E_TEST_SUITE_SUMMARY.md](./E2E_TEST_SUITE_SUMMARY.md)
