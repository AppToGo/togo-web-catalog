/**
 * Catalog Services Index
 * 
 * Centralized exports for catalog-related services and types.
 */

// Service exports
export { 
  CatalogService, 
  catalogService,
  getBusinessCatalog,
  getProductDetails,
  getCategories,
  searchProducts,
  getAllBusinessSlugs,
} from './catalog.service';

// Type exports
export type {
  CatalogProduct,
  Category,
  SubCategory,
  BusinessInfo,
  CatalogResponse,
  SearchResponse,
  CartItem,
  Cart,
  OrderResponse,
  CustomerOrigin,
  CustomerData,
  OrderStatusType,
  OpeningHours,
  CatalogFilters,
  PaginationParams,
  PaginatedProducts,
  CatalogApiError,
  CatalogErrorCode,
  StructuredDataProduct,
  StructuredDataBusiness,
  BusinessTheme,
} from '@/src/types/catalog.types';
