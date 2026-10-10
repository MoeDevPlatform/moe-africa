/** Route manifest for UI audit — derived from src/App.tsx */
export const publicRoutes = [
  '/',
  '/marketplace',
  '/auth',
  '/marketplace/products',
  '/marketplace/artisans',
  '/help/payments',
  '/help/shipping',
  '/help/contact-artisans',
  '/help/getting-started',
  '/about',
  '/how-it-works',
] as const;

export const marketplaceSupportRoutes = [
  '/marketplace/support/help',
  '/marketplace/support/faqs',
  '/marketplace/support/contact',
] as const;

export const auditInteractiveChecks: Array<{
  route: string;
  selectors: string[];
}> = [
  { route: '/auth', selectors: ['button:has-text("Sign In")', 'button:has-text("Sign Up")'] },
  { route: '/marketplace', selectors: ['nav a', 'header a'] },
];
