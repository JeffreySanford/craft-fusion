import { SetMetadata } from '@nestjs/common';

export const AllowGuest = () => SetMetadata('guestAllowed', true);
