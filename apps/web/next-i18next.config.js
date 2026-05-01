module.exports = {
  i18n: {
    defaultLocale: 'tr',
    locales: ['tr', 'en'],
  },
  ns: ['common', 'auth', 'admin', 'dashboard', 'survey', 'employee', 'consultant'],
  defaultNS: 'common',
  localePath: typeof window === 'undefined' ? require('path').resolve('./public/locales') : '/locales',
  reloadOnPrerender: process.env.NODE_ENV === 'development',
};
