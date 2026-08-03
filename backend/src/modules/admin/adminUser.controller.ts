import { Request, Response } from 'express';
import { sendSuccess } from '@common/utils/apiResponse';
import { buildPaginationMeta } from '@common/utils/pagination';
import { userService } from '@modules/user/user.service';
import { adminUserService } from './adminUser.service';
import {
  CreatePrivilegedUserInput,
  DeactivationReasonInput,
  ListUsersQuery,
} from './adminUser.validation';

export class AdminUserController {
  async list(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as ListUsersQuery;
    const { items, total } = await adminUserService.list(query);
    sendSuccess(
      res,
      items.map((user) => userService.toDTO(user)),
      200,
      buildPaginationMeta(query, total)
    );
  }

  async create(req: Request, res: Response): Promise<void> {
    const user = await adminUserService.createPrivilegedUser(req.body as CreatePrivilegedUserInput);
    sendSuccess(res, userService.toDTO(user), 201);
  }

  async deactivate(req: Request, res: Response): Promise<void> {
    const { reason } = req.body as DeactivationReasonInput;
    const user = await adminUserService.deactivate(req.params.userId, req.user!.id, reason);
    sendSuccess(res, userService.toDTO(user));
  }

  async reactivate(req: Request, res: Response): Promise<void> {
    const { reason } = req.body as DeactivationReasonInput;
    const user = await adminUserService.reactivate(req.params.userId, req.user!.id, reason);
    sendSuccess(res, userService.toDTO(user));
  }
}

export const adminUserController = new AdminUserController();
