import { Request } from 'express';

export class Pagination {
  static generatePaginationMetadata(
    request: Request,
    currentPage: number,
    totalItems: number,
    itemsPerPage: number,
  ) {
    // Construire l'URL de base avec le protocole et le domaine
    const baseUrl = `${request.protocol}://${request.get('host')}`;
    // Utiliser req.path pour éviter d'inclure les query parameters existants
    const path = request.path;

    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const links = {
      self: `${baseUrl}${path}?page=${currentPage}&limit=${itemsPerPage}`,
    };
    if (currentPage < totalPages) {
      links['next'] = `${baseUrl}${path}?page=${currentPage + 1}&limit=${itemsPerPage}`;
    }
    if (currentPage > 1) {
      links['prev'] = `${baseUrl}${path}?page=${currentPage - 1}&limit=${itemsPerPage}`;
    }
    links['last'] = `${baseUrl}${path}?page=${totalPages}&limit=${itemsPerPage}`;
    const meta = {
      totalItems,
      currentPage,
      totalPages,
      itemsPerPage,
    };
    return { links, meta };
  }
}