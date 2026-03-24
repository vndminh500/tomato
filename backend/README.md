# Backend Documentation

This document provides instructions for setting up and running the backend server for the food app.

## Environment Variables

Create a `.env` file in the `backend` directory and add the following environment variables. You can use the `.env.example` file as a template.

-   `JWT_SECRET`: A secret key for creating and verifying JSON Web Tokens (JWT). You can generate a random string for this.
-   `STRIPE_SECRET_KEY`: Your secret key from Stripe for processing payments.

### Example `.env` file:

```
JWT_SECRET="your_super_secret_jwt_key"
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
```
