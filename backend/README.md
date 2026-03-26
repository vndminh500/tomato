# Backend Documentation

This document provides instructions for setting up and running the backend server for the food app.

## Environment Variables

Create a `.env` file in the `backend` directory and add the following environment variables. You can use the `.env.example` file as a template.

-   `JWT_SECRET`: A secret key for creating and verifying JSON Web Tokens (JWT). You can generate a random string for this.
-   `VNPAY_TMN_CODE`: VNPay terminal code.
-   `VNPAY_SECURE_SECRET`: VNPay secure secret.
-   `VNPAY_HOST`: VNPay host URL (sandbox/production).
-   `VNPAY_TEST_MODE`: Set `true` for sandbox mode.
-   `FRONTEND_URL`: Frontend application URL.
-   `BACKEND_URL`: Backend server URL.

### Example `.env` file:

```
JWT_SECRET="your_super_secret_jwt_key"
VNPAY_TMN_CODE="your_vnpay_tmn_code"
VNPAY_SECURE_SECRET="your_vnpay_secure_secret"
VNPAY_HOST="https://sandbox.vnpayment.vn"
VNPAY_TEST_MODE="true"
FRONTEND_URL="http://localhost:5173"
BACKEND_URL="http://localhost:4000"
```
