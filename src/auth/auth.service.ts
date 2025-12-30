import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OwnersService } from '../owners/owners.service';
import { LoginDto } from './dto/login.dto';

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    login: string;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly ownersService: OwnersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const owner = await this.ownersService.validateOwner(
      loginDto.username,
      loginDto.password,
    );
    
    const payload = {
      sub: owner.id,
      login: owner.login,
    };

    return {
      token: this.jwtService.sign(payload),
      user: {
        id: owner.id,
        login: owner.login,
      },
    };
  }

  async validateOwnerById(id: string) {
    try {
      const owner = await this.ownersService.findById(id);
      return {
        id: owner.id,
        login: owner.login,
      };
    } catch (error) {
      return null;
    }
  }

  async logout() {
    return { message: 'Logged out successfully' };
  }
}

