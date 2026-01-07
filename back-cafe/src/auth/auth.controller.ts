// src/auth/auth.controller.ts
import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(
    @Body() body: { email: string; password: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(body.email, body.password);

    if (!result) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    res.cookie('access_token', result.accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false, // true em produção
      path: '/',
      maxAge: 24 * 60 * 60 * 1000, // 24 horas
    });

    return { 
      user: result.user,
      // Opcional: também retornar dados básicos do usuário
      userInfo: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role
      }
    };
  }

  @Get('me')
  async getCurrentUser(@Req() req: Request) {
    const token = req.cookies['access_token'];
    
    if (!token) {
      throw new UnauthorizedException('Não autenticado');
    }
    
    try {
      const decoded = await this.authService.verifyToken(token);
      
      // Retorna informações públicas do usuário
      return {
        id: decoded.sub,
        email: decoded.email,
        role: decoded.role,
      };
    } catch (error) {
      throw new UnauthorizedException('Token inválido ou expirado');
    }
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/',
    });

    return { message: 'Logout realizado' };
  }
}