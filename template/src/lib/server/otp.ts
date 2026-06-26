import { getUserByEmail, createUser, updateUser } from '$lib/server/user';
import { serverConfig } from '$lib/server/config';
import { sendEmail } from '$lib/server/email';

const MAX_OTP_ATTEMPTS = 5;

function generateCode(): string {
	// 6-digit numeric code.
	return Math.floor(100000 + Math.random() * 900000).toString();
}

/** Create/refresh an OTP for the given email and send it. Returns nothing useful to the client. */
export async function requestOtp(email: string): Promise<void> {
	const code = generateCode();
	const otpExpiry = new Date(Date.now() + serverConfig.otp.expirationMs);

	let user = await getUserByEmail(email);
	if (!user) {
		user = await createUser({ email, otp: code, otpExpiry, otpAttempts: 0 });
	} else {
		await updateUser(user.id, { otp: code, otpExpiry, otpAttempts: 0 });
	}

	await sendEmail({
		to: email,
		subject: `Your ${serverConfig.appName} login code`,
		text: `Your login code is ${code}. It expires in ${serverConfig.otp.expirationMinutes} minutes.`
	});
}

export type OtpResult =
	| { ok: true; userId: string }
	| { ok: false; reason: 'no-otp' | 'expired' | 'too-many-attempts' | 'invalid' };

/** Verify an OTP. On success, clears OTP state and marks the user verified. */
export async function verifyOtp(email: string, code: string): Promise<OtpResult> {
	const user = await getUserByEmail(email);
	if (!user || !user.otp || !user.otpExpiry) return { ok: false, reason: 'no-otp' };

	if ((user.otpAttempts ?? 0) >= MAX_OTP_ATTEMPTS) {
		return { ok: false, reason: 'too-many-attempts' };
	}

	if (Date.now() > user.otpExpiry.getTime()) return { ok: false, reason: 'expired' };

	if (user.otp !== code) {
		await updateUser(user.id, { otpAttempts: (user.otpAttempts ?? 0) + 1 });
		return { ok: false, reason: 'invalid' };
	}

	await updateUser(user.id, {
		otp: null,
		otpExpiry: null,
		otpAttempts: 0,
		isVerified: true
	});
	return { ok: true, userId: user.id };
}
