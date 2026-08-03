import { NextFunction, Request, Response } from 'express';
import { asyncHandler } from '@common/utils/asyncHandler';

describe('asyncHandler', () => {
  it('calls the wrapped handler with req/res/next', async () => {
    const handler = jest.fn().mockResolvedValue(undefined);
    const wrapped = asyncHandler(handler);
    const req = {} as Request;
    const res = {} as Response;
    const next = jest.fn() as NextFunction;

    wrapped(req, res, next);
    await Promise.resolve();

    expect(handler).toHaveBeenCalledWith(req, res, next);
  });

  it('forwards a rejected promise to next() instead of throwing', async () => {
    const error = new Error('boom');
    const handler = jest.fn().mockRejectedValue(error);
    const wrapped = asyncHandler(handler);
    const req = {} as Request;
    const res = {} as Response;
    const next = jest.fn() as NextFunction;

    wrapped(req, res, next);
    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalledWith(error);
  });
});
