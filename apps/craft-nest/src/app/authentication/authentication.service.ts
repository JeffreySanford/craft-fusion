import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthenticationService {
  login(username: string, password: string): string {
    return 'Dummy token for ' + username;
  }
}
