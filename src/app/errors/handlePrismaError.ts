import { Prisma } from '../../../generated/prisma/client';
import { TErrorSources, TGenericErrorResponse } from '../types/errors.type';

const fieldMap: Record<string, string> = {
  email: 'Email',
  username: 'Username',
  password: 'Password',
  contactNumber: 'Contact Number',
};

export const handlePrismaError = (
  error:
    | Prisma.PrismaClientKnownRequestError
    | Prisma.PrismaClientValidationError,
): TGenericErrorResponse => {
  let statusCode = 400;
  let message = 'Something went wrong. Please try again';
  let errorSources: TErrorSources = [];

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002': {
        const field = (error.meta?.target as string[])?.[0] || 'field';
        const fieldName = fieldMap[field] || field;

        message = `${fieldName} already exists`;
        errorSources = [
          {
            path: field,
            message: `${fieldName} is already registered`,
          },
        ];
        break;
      }
      case 'P2025': {
        statusCode = 404;
        message = 'Requested resource not found';
        errorSources = [
          {
            path: '',
            message: 'The requested data does not exist',
          },
        ];
        break;
      }
      case 'P2003': {
        message = 'Invalid reference provided';
        errorSources = [
          {
            path: '',
            message: 'Related data not found or invalid',
          },
        ];
        break;
      }
      case 'P2012':
      case 'P2013': {
        message = 'Required information is missing';
        errorSources = [
          {
            path: '',
            message: 'Please provide all required fields',
          },
        ];
        break;
      }
      case 'P2005':
      case 'P2006':
      case 'P2007':
      case 'P2009': {
        message = 'Invalid data provided';
        errorSources = [
          {
            path: '',
            message: 'One or more fields have invalid values',
          },
        ];
        break;
      }
      case 'P2011': {
        message = 'Missing required field';
        errorSources = [
          {
            path: '',
            message: 'A required field cannot be empty',
          },
        ];
        break;
      }
      case 'P2024': {
        statusCode = 503;
        message = 'Server is busy. Please try again';
        errorSources = [
          {
            path: '',
            message: 'Database timeout occurred',
          },
        ];
        break;
      }
      default: {
        message = 'Something went wrong. Please try again';
        errorSources = [
          {
            path: '',
            message: 'Database operation failed',
          },
        ];
        break;
      }
    }
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = 'Invalid input data';
    errorSources = [
      {
        path: '',
        message: 'One or more fields are invalid',
      },
    ];
  }

  return {
    statusCode,
    message,
    errorSources,
  };
};