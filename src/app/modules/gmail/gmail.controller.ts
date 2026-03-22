import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { GmailService } from './gmail.service';
import verifyToken from '../../utils/verifyToken';
import configs from '../../configs';

const parseCookieValue = (cookieHeader: string | undefined, key: string) => {
  if (!cookieHeader) {
    return undefined;
  }
  const parts = cookieHeader.split(';').map((part) => part.trim());
  const found = parts.find((part) => part.startsWith(`${key}=`));
  if (!found) {
    return undefined;
  }
  return decodeURIComponent(found.split('=')[1] || '');
};

const connectGmail = catchAsync(async (req, res) => {
  // Extract JWT token from cookies
  const cookieAccessToken = parseCookieValue(req.headers.cookie, 'accessToken');

  if (!cookieAccessToken) {
    return sendResponse(res, {
      statusCode: 401,
      success: false,
      message: 'Access token not found in cookies',
    });
  }

  // Verify and decode the JWT
  const decoded = (await verifyToken(
    cookieAccessToken,
    configs.jwtAccessSecret as string,
  )) as Record<string, unknown>;

  const userId = decoded.id as string;
  const code = req.body.code;

  // Now call your GmailService with userId and code
  const result = await GmailService.connectGmail(userId, code);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Gmail connected successfully',
    data: result,
  });
});

export const GmailController = {
  connectGmail,
};