import { sha256 } from '@common/utils/hash';
import { RefreshTokenDocument, RefreshTokenModel } from './refreshToken.model';
import {
  VerificationTokenDocument,
  VerificationTokenModel,
  VerificationTokenType,
} from './verificationToken.model';

export class AuthRepository {
  async saveRefreshToken(userId: string, rawToken: string, expiresAt: Date): Promise<void> {
    await RefreshTokenModel.create({ userId, tokenHash: sha256(rawToken), expiresAt });
  }

  async findActiveRefreshToken(rawToken: string): Promise<RefreshTokenDocument | null> {
    return RefreshTokenModel.findOne({
      tokenHash: sha256(rawToken),
      revokedAt: { $exists: false },
      expiresAt: { $gt: new Date() },
    }).exec();
  }

  async revokeRefreshToken(rawToken: string): Promise<void> {
    await RefreshTokenModel.updateOne(
      { tokenHash: sha256(rawToken) },
      { $set: { revokedAt: new Date() } }
    ).exec();
  }

  async revokeAllRefreshTokensForUser(userId: string): Promise<void> {
    await RefreshTokenModel.updateMany(
      { userId, revokedAt: { $exists: false } },
      { $set: { revokedAt: new Date() } }
    ).exec();
  }

  async saveVerificationToken(
    userId: string,
    type: VerificationTokenType,
    rawToken: string,
    expiresAt: Date
  ): Promise<void> {
    await VerificationTokenModel.create({ userId, type, tokenHash: sha256(rawToken), expiresAt });
  }

  async findActiveVerificationToken(
    rawToken: string,
    type: VerificationTokenType
  ): Promise<VerificationTokenDocument | null> {
    return VerificationTokenModel.findOne({
      tokenHash: sha256(rawToken),
      type,
      usedAt: { $exists: false },
      expiresAt: { $gt: new Date() },
    }).exec();
  }

  async markVerificationTokenUsed(id: string): Promise<void> {
    await VerificationTokenModel.updateOne({ _id: id }, { $set: { usedAt: new Date() } }).exec();
  }
}

export const authRepository = new AuthRepository();
