import { Request, Response } from 'express';
import { sendSuccess } from '@common/utils/apiResponse';
import { storageClient } from '@common/storage';
import { UnprocessableEntityError } from '@common/errors/AppError';
import { userService } from './user.service';
import { UpdateProfileInput } from './user.validation';

export class UserController {
  async getMe(req: Request, res: Response): Promise<void> {
    const user = await userService.getById(req.user!.id);
    sendSuccess(res, userService.toDTO(user));
  }

  async updateMe(req: Request, res: Response): Promise<void> {
    const updates = req.body as UpdateProfileInput;
    const user = await userService.updateProfile(req.user!.id, updates);
    sendSuccess(res, userService.toDTO(user));
  }

  async uploadAvatar(req: Request, res: Response): Promise<void> {
    if (!req.file) {
      throw new UnprocessableEntityError('An image file is required.');
    }
    const stored = await storageClient.save({
      category: 'avatars',
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      buffer: req.file.buffer,
    });
    const user = await userService.updateProfile(req.user!.id, { avatarUrl: stored.url });
    sendSuccess(res, userService.toDTO(user));
  }
}

export const userController = new UserController();
