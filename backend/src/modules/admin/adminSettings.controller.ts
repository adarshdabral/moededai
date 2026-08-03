import { Request, Response } from 'express';
import { sendSuccess } from '@common/utils/apiResponse';
import { adminSettingsService, PlatformSettingsDTO } from './adminSettings.service';

export class AdminSettingsController {
  async get(_req: Request, res: Response): Promise<void> {
    const settings = await adminSettingsService.get();
    sendSuccess(res, adminSettingsService.toDTO(settings));
  }

  async update(req: Request, res: Response): Promise<void> {
    const settings = await adminSettingsService.update(req.body as Partial<PlatformSettingsDTO>);
    sendSuccess(res, adminSettingsService.toDTO(settings));
  }
}

export const adminSettingsController = new AdminSettingsController();
