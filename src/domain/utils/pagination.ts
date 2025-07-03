import { Request } from 'express';

export class Pagination {
  static generatePaginationMetadata(
    request: Request,
    currentPage: number,
    totalItems: number,
    itemsPerPage: number,
  ) {
    // Convertir currentPage et itemsPerPage en nombres et s'assurer qu'ils sont valides
    const page = Math.max(1, parseInt(currentPage.toString(), 10));
    const limit = Math.max(1, parseInt(itemsPerPage.toString(), 10));

    // Construire l'URL de base avec le protocole et le domaine
    const baseUrl = `${request.protocol}://${request.get('host')}`;
    const path = request.path;

    // Calculer le nombre total de pages, avec un minimum de 1
    const totalPages = Math.max(1, Math.ceil(totalItems / limit));

    const links: { [key: string]: string } = {
      self: `${baseUrl}${path}?page=${page}&limit=${limit}`,
      first: `${baseUrl}${path}?page=1&limit=${limit}`,
    };

    // Ajouter le lien 'last' uniquement si totalItems > 0
    if (totalItems > 0) {
      links['last'] = `${baseUrl}${path}?page=${totalPages}&limit=${limit}`;
    } else {
      links['last'] = `${baseUrl}${path}?page=1&limit=${limit}`; // Pointe vers page=1 si aucun élément
    }

    // Ajouter les liens 'next' et 'prev' si nécessaire
    if (page < totalPages) {
      links['next'] = `${baseUrl}${path}?page=${page + 1}&limit=${limit}`;
    }
    if (page > 1) {
      links['prev'] = `${baseUrl}${path}?page=${page - 1}&limit=${limit}`;
    }

    const meta = {
      totalItems,
      currentPage: page,
      totalPages,
      itemsPerPage: limit,
    };

    return { links, meta };
  }
}