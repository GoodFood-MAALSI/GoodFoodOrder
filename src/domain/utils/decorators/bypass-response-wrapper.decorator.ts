import { SetMetadata } from '@nestjs/common';

export const BypassResponseWrapper = () => SetMetadata('bypassResponseWrapper', true);