import { Response } from 'express';
import { sendError, sendSuccess } from '@common/utils/apiResponse';
import { ErrorCode } from '@common/errors/errorCodes';

function mockResponse(): Response {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('apiResponse envelope', () => {
  it('sendSuccess wraps data in the standard success envelope with default 200', () => {
    const res = mockResponse();
    sendSuccess(res, { id: '1' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: '1' } });
  });

  it('sendSuccess includes pagination meta when provided', () => {
    const res = mockResponse();
    sendSuccess(res, [1, 2], 200, { page: 1, limit: 20, total: 2 });
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: [1, 2],
      meta: { pagination: { page: 1, limit: 20, total: 2 } },
    });
  });

  it('sendSuccess supports a custom status code (e.g. 201 Created)', () => {
    const res = mockResponse();
    sendSuccess(res, { id: '1' }, 201);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('sendError wraps a code/message in the standard error envelope', () => {
    const res = mockResponse();
    sendError(res, 404, ErrorCode.NOT_FOUND, 'Course not found.');
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: ErrorCode.NOT_FOUND, message: 'Course not found.', details: undefined },
    });
  });
});
