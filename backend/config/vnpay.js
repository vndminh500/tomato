import { VNPay } from 'vnpay';
import 'dotenv/config';

const vnpHostFromLegacyUrl = process.env.VNP_URL
  ? new URL(process.env.VNP_URL).origin
  : undefined;

const vnpay = new VNPay({
  tmnCode: process.env.VNPAY_TMN_CODE || process.env.VNP_TMNCODE,
  secureSecret: process.env.VNPAY_SECURE_SECRET || process.env.VNP_HASHSECRET,
  vnpayHost: process.env.VNPAY_HOST || vnpHostFromLegacyUrl || 'https://sandbox.vnpayment.vn',
  testMode: (process.env.VNPAY_TEST_MODE || 'true') === 'true',
  hashAlgorithm: 'SHA512',
});

export default vnpay;
