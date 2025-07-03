import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    // Déterminer le statut HTTP
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Obtenir la réponse de l'exception (si HttpException)
    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    // Préparer les champs message et error
    let message: string;
    let error: string;

    if (exceptionResponse && typeof exceptionResponse === 'object') {
      // Si exceptionResponse est un objet, extraire message et error
      message =
        (exceptionResponse as any).message || 'Une erreur est survenue';
      error =
        (exceptionResponse as any).error ||
        HttpStatus[status] ||
        'Internal Server Error';
    } else if (typeof exceptionResponse === 'string') {
      // Si exceptionResponse est une chaîne, l'utiliser comme message
      message = exceptionResponse;
      error = HttpStatus[status] || 'Internal Server Error';
    } else {
      // Cas par défaut (exception non HttpException ou pas de réponse)
      message = 'Une erreur est survenue';
      error = 'Internal Server Error';
    }

    // Construire la réponse standardisée
    const errorResponse = {
      statusCode: status,
      message,
      error,
    };

    response.status(status).json(errorResponse);
  }
}