/**
 * Pagination Configuration for Book V2
 * Responsive page dimensions based on viewport and font size
 */

export interface PaginationConfig {
  pageWidth: number;
  pageHeight: number;
  fontSize: number;
  lineHeight: number;
  isMobile: boolean;
  contentPadding: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

/**
 * Create pagination config from container dimensions
 */
export function createPaginationConfig(
  containerRect: DOMRect,
  fontSize: number,
  isMobile: boolean
): PaginationConfig {
  // Calculate page dimensions based on viewport
  const pageWidth = isMobile
    ? containerRect.width - 32 // 16px padding each side
    : Math.floor((containerRect.width / 2) - 64); // Half spread minus margins

  // Reserve space for header/footer navigation
  const pageHeight = Math.floor(containerRect.height - 120);

  // Line height scales slightly with font size for readability
  const lineHeight = fontSize * (fontSize <= 16 ? 1.6 : fontSize >= 22 ? 1.8 : 1.7);

  return {
    pageWidth,
    pageHeight,
    fontSize,
    lineHeight,
    isMobile,
    contentPadding: {
      top: 24,
      bottom: 40,
      left: 24,
      right: 24,
    },
  };
}

/**
 * Calculate how many lines fit on a page
 */
export function getLinesPerPage(config: PaginationConfig): number {
  const availableHeight = config.pageHeight - config.contentPadding.top - config.contentPadding.bottom;
  return Math.floor(availableHeight / config.lineHeight);
}

/**
 * Calculate first page capacity (with photo, title, etc.)
 */
export function getFirstPageCapacity(config: PaginationConfig, hasPhoto: boolean): number {
  const photoHeight = hasPhoto ? 260 : 0;
  const titleHeight = 60;
  const dateHeight = 45;
  const audioHeight = 48;
  const spacing = 32;

  const fixedElementsHeight = photoHeight + titleHeight + dateHeight + audioHeight + spacing;
  const availableHeight = config.pageHeight - config.contentPadding.top - config.contentPadding.bottom - fixedElementsHeight;

  return Math.floor(availableHeight / config.lineHeight);
}

/**
 * Calculate continuation page capacity
 */
export function getContinuationPageCapacity(config: PaginationConfig): number {
  const headerHeight = 48; // "(continued)" header
  const availableHeight = config.pageHeight - config.contentPadding.top - config.contentPadding.bottom - headerHeight;

  return Math.floor(availableHeight / config.lineHeight);
}
