// Application-wide constants

export const APP_NAME = 'Hoostn';
export const APP_DESCRIPTION = 'Gestion de locations saisonnières';

// Pricing
export const PRICE_PER_LOT_MONTHLY = 10; // €10/mois/lot
export const FREE_PLAN_MAX_LOTS = 1;

// Booking rules
export const MIN_BOOKING_HOURS_BEFORE = 72; // 72h minimum avant l'arrivée
export const CLEANING_TASK_DELAY_HOURS = 2; // Tâche ménage déclenchée 2h après départ

// AI configuration
export const AI_CONFIDENCE_THRESHOLD = 0.6; // Seuil pour escalade HITL
export const AI_MESSAGE_RETENTION_DAYS = 30;

// File upload limits
export const MAX_IMAGE_SIZE_MB = 10;
export const MAX_IMAGES_PER_LOT = 20;

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Supported locales
export const SUPPORTED_LOCALES = ['fr', 'en'] as const;
export const DEFAULT_LOCALE = 'fr';

// Date formats
export const DATE_FORMAT = 'dd/MM/yyyy';
export const DATETIME_FORMAT = 'dd/MM/yyyy HH:mm';

// OTA sync intervals
export const AIRBNB_ICAL_SYNC_MINUTES = 30;
export const BOOKING_API_SYNC_MINUTES = 15;
