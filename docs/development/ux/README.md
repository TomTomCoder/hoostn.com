# Authentication UX & Security Documentation

Complete documentation for implementing secure, accessible, and beautiful authentication flows for Hoostn.com.

## Documentation Overview

This documentation suite provides comprehensive guidance for implementing authentication with best-in-class UX and security.

### 📚 Available Documents

1. **[Authentication Guide](./authentication-guide.md)** (Main Document)
   - Complete authentication flow patterns
   - Form design best practices
   - Security implementation guide
   - Accessibility compliance
   - Implementation roadmap

2. **[Quick Reference](./auth-quick-reference.md)**
   - Common code snippets
   - Hoostn color classes
   - Checklists
   - Quick patterns

3. **[Visual Design Spec](./auth-visual-spec.md)**
   - Page layouts
   - Component specifications
   - Responsive designs
   - Animation guidelines
   - Mobile considerations

4. **[Code Examples](./auth-code-examples.md)**
   - Complete component implementations
   - API route examples
   - Email templates
   - Hooks and utilities

---

## Quick Start

### 1. Read the Main Guide
Start with [authentication-guide.md](./authentication-guide.md) to understand:
- Why magic links are recommended
- Security considerations
- Accessibility requirements
- Overall architecture

### 2. Review Visual Specs
Check [auth-visual-spec.md](./auth-visual-spec.md) for:
- Exact layouts
- Color usage
- Spacing guidelines
- Component styling

### 3. Implement with Code Examples
Use [auth-code-examples.md](./auth-code-examples.md) to:
- Copy production-ready components
- Set up API routes
- Configure email templates
- Implement rate limiting

### 4. Reference Quick Guide
Keep [auth-quick-reference.md](./auth-quick-reference.md) handy for:
- Common patterns
- Class names
- Validation rules
- Security checklist

---

## Key Recommendations

### Authentication Strategy
✅ **Primary:** Magic Link (email-based)  
✅ **Secondary:** Password (optional)  
✅ **Future:** OAuth (Google, Microsoft)

**Why Magic Links?**
- More secure (no password reuse/leaks)
- Better UX (one-click sign-in)
- Lower support burden (no password resets)
- Mobile-friendly
- Industry standard (Notion, Slack, Linear)

### Security Priorities
1. ✅ Rate limiting (5 requests/15 min)
2. ✅ CSRF protection
3. ✅ Secure cookies (HttpOnly, Secure, SameSite)
4. ✅ Brute force protection
5. ✅ Input validation (client + server)

### Accessibility Priorities
1. ✅ WCAG 2.1 Level AA compliance
2. ✅ Keyboard navigation
3. ✅ Screen reader support
4. ✅ 4.5:1 contrast ratios
5. ✅ Focus indicators (3px accent)

---

## Hoostn Brand Integration

### Colors
```typescript
primary:    #1F3A8A  // Main actions, links
accent:     #00C48C  // Success, CTAs
error:      #E53E3E  // Errors, warnings
anthracite: #333333  // Body text
light:      #F5F6F8  // Backgrounds
```

### Typography
- **Font:** Inter (all weights)
- **Headings:** Bold (700)
- **Body:** Regular (400)
- **UI:** Medium (500)

### Design Language
- **Rounded corners:** 16px (2xl)
- **Shadows:** Subtle (0 1px 3px rgba(0,0,0,0.06))
- **Spacing:** 8px grid system
- **Touch targets:** 44px minimum

---

## Implementation Phases

### Phase 1: Core Auth (Week 1-2)
- [ ] Magic link authentication
- [ ] Sign-in/sign-up pages
- [ ] Email templates
- [ ] Basic security (CSRF, rate limiting)

### Phase 2: Enhancement (Week 3-4)
- [ ] Password authentication (optional)
- [ ] Session management
- [ ] Remember me
- [ ] Error handling

### Phase 3: OAuth (Week 5-6)
- [ ] Google OAuth
- [ ] Microsoft OAuth
- [ ] Account linking

### Phase 4: Polish (Week 7-8)
- [ ] Performance optimization
- [ ] Accessibility audit
- [ ] Security testing
- [ ] Documentation

---

## Tech Stack

### Required Dependencies
```bash
npm install next-auth @auth/prisma-adapter
npm install @upstash/redis @upstash/ratelimit
npm install resend @react-email/components
npm install lucide-react clsx zod
```

### Services Needed
- **Database:** PostgreSQL (via Prisma)
- **Email:** Resend
- **Rate Limiting:** Upstash Redis
- **Hosting:** Vercel

---

## File Structure

```
apps/web/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── verify-email/page.tsx
│   │   └── reset-password/page.tsx
│   └── api/auth/
│       ├── [...nextauth]/route.ts
│       ├── magic-link/route.ts
│       └── verify/route.ts
├── components/
│   ├── auth/
│   │   ├── SignInForm.tsx
│   │   ├── SignUpForm.tsx
│   │   └── SocialLoginButtons.tsx
│   └── ui/
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       └── divider.tsx
├── lib/
│   ├── auth/
│   │   ├── config.ts
│   │   └── rate-limit.ts
│   └── validations/
│       └── auth.ts
└── emails/
    └── MagicLinkEmail.tsx
```

---

## Testing Checklist

### Functional Testing
- [ ] Sign in with email works
- [ ] Magic link received and valid
- [ ] Link expires after 15 minutes
- [ ] Rate limiting blocks excessive requests
- [ ] Error messages are helpful
- [ ] Redirects work correctly

### Security Testing
- [ ] CSRF tokens validated
- [ ] Cookies are HttpOnly & Secure
- [ ] Rate limiting effective
- [ ] XSS prevention working
- [ ] SQL injection prevented (use Prisma)

### Accessibility Testing
- [ ] Keyboard navigation works
- [ ] Screen reader announces changes
- [ ] Focus indicators visible
- [ ] Contrast ratios pass
- [ ] Touch targets large enough
- [ ] Forms can be completed with keyboard only

### Performance Testing
- [ ] Page loads under 2 seconds
- [ ] API responses under 500ms
- [ ] Email delivery under 5 seconds
- [ ] No blocking operations

---

## Support & Resources

### Documentation
- [NextAuth.js Docs](https://next-auth.js.org/)
- [OWASP Auth Guide](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

### Internal Resources
- Brand Kit: `/docs/brand/Brand Kit.md`
- Development Docs: `/docs/development/`
- Existing Components: `/apps/web/components/ui/`

### Contact
- **Technical Lead:** David Bechtel
- **Design Lead:** Tommy Lambert
- **Team:** Hoostn Development

---

## FAQ

**Q: Why magic links instead of passwords?**  
A: More secure, better UX, less support burden, industry standard.

**Q: Should we require strong passwords if we offer password auth?**  
A: Yes. Minimum 12 characters, mixed case, numbers, special characters.

**Q: How do we handle rate limiting on serverless?**  
A: Use Upstash Redis with the @upstash/ratelimit package.

**Q: What about OAuth?**  
A: Phase 3 feature. Google and Microsoft recommended.

**Q: How do we ensure accessibility?**  
A: Follow WCAG 2.1 AA guidelines, test with keyboard and screen readers.

**Q: What about mobile?**  
A: Mobile-first design, 44px touch targets, appropriate input types.

---

## Updates

**Version 1.0** (November 2025)
- Initial documentation suite
- Complete authentication patterns
- Security best practices
- Accessibility guidelines
- Code examples

**Next Review:** December 2025

---

## Contributing

When updating this documentation:
1. Keep examples aligned with Hoostn brand
2. Test all code examples
3. Verify accessibility compliance
4. Update version and date
5. Notify team of changes

---

**Made with ❤️ for Hoostn by the Development Team**
