import { Request, Response } from 'express';
import { sendSuccess } from '@common/utils/apiResponse';
import { authService } from './auth.service';
import {
  LoginInput,
  LogoutInput,
  RefreshInput,
  RegisterInput,
  RequestPasswordResetInput,
  ResetPasswordInput,
  VerifyEmailInput,
} from './auth.validation';

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    const result = await authService.register(req.body as RegisterInput);
    sendSuccess(res, result, 201);
  }

  async login(req: Request, res: Response): Promise<void> {
    const result = await authService.login(req.body as LoginInput);
    sendSuccess(res, result);
  }

  async refresh(req: Request, res: Response): Promise<void> {
    const { refreshToken } = req.body as RefreshInput;
    const tokens = await authService.refresh(refreshToken);
    sendSuccess(res, tokens);
  }

  async logout(req: Request, res: Response): Promise<void> {
    const { refreshToken } = req.body as LogoutInput;
    await authService.logout(refreshToken);
    res.status(204).send();
  }

  async verifyEmail(req: Request, res: Response): Promise<void> {
    const { token } = req.body as VerifyEmailInput;
    await authService.verifyEmail(token);
    sendSuccess(res, { verified: true });
  }

  async requestPasswordReset(req: Request, res: Response): Promise<void> {
    const { email } = req.body as RequestPasswordResetInput;
    await authService.requestPasswordReset(email);
    sendSuccess(res, { requested: true });
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    await authService.resetPassword(req.body as ResetPasswordInput);
    sendSuccess(res, { reset: true });
  }
}

export const authController = new AuthController();
