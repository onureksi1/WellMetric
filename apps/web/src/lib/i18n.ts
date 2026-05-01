import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import commonTr from '../../public/locales/tr/common.json';
import authTr from '../../public/locales/tr/auth.json';
import adminTr from '../../public/locales/tr/admin.json';
import dashboardTr from '../../public/locales/tr/dashboard.json';
import surveyTr from '../../public/locales/tr/survey.json';
import employeeTr from '../../public/locales/tr/employee.json';
import consultantTr from '../../public/locales/tr/consultant.json';

import commonEn from '../../public/locales/en/common.json';
import authEn from '../../public/locales/en/auth.json';
import adminEn from '../../public/locales/en/admin.json';
import dashboardEn from '../../public/locales/en/dashboard.json';
import surveyEn from '../../public/locales/en/survey.json';
import employeeEn from '../../public/locales/en/employee.json';
import consultantEn from '../../public/locales/en/consultant.json';

const resources = {
  tr: {
    common: commonTr,
    auth: authTr,
    admin: adminTr,
    dashboard: dashboardTr,
    survey: surveyTr,
    employee: employeeTr,
    consultant: consultantTr,
  },
  en: {
    common: commonEn,
    auth: authEn,
    admin: adminEn,
    dashboard: dashboardEn,
    survey: surveyEn,
    employee: employeeEn,
    consultant: consultantEn,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: 'tr', // default language
    fallbackLng: 'tr',
    ns: ['common', 'auth', 'admin', 'dashboard', 'survey', 'employee', 'consultant'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'cookie', 'htmlTag', 'path', 'subdomain'],
      caches: ['localStorage', 'cookie'],
    },
  });

export default i18n;
