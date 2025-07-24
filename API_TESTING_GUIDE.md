# Transaction API Testing Guide

This guide will help you test the transaction API endpoints using tools like Postman, Insomnia, or curl.

## Prerequisites

1. **Server Running**: Make sure your server is running on `http://localhost:3000`
2. **Database Ready**: Transaction tables are created from the migration
3. **Test Data**: You'll need some users and products in your database

## 🔑 Authentication Setup

All transaction endpoints require JWT authentication. First, you need to:

### 1. Register/Login to get JWT Token

**Register a new user:**
```bash
POST http://localhost:3000/auth/register
Content-Type: application/json

{
  "email": "buyer@test.com",
  "password": "password123",
  "name": "John",
  "role": "USER"
}
```

**Login to get token:**
```bash
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "email": "buyer@test.com",
  "password": "password123"
}
```

**Response will include:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

**Copy the `access_token`** - you'll need this for all transaction requests.

### 2. Set Authorization Header

For all transaction requests, add this header:
```
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```

## 📦 Test Data Setup

Before testing transactions, create some test data:

### Create a Category
```bash
POST http://localhost:3000/category
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "name": "Electronics",
  "description": "Electronic items"
}
```

### Create a Product (as seller)
```bash
POST http://localhost:3000/products
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "title": "iPhone 13",
  "description": "Excellent condition iPhone 13",
  "price": 800,
  "quantity": 2,
  "categoryId": 1,
  "condition": "LIKE_NEW",
  "isAvailable": true
}
```

## 🛒 Transaction API Endpoints Testing

### 1. Create Transaction
```bash
POST http://localhost:3000/transaction
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "items": [
    {
      "productId": "bb31023e-cff7-4e63-8ac9-b537d455d2a8",
      "quantity": 1,
      "unitPrice": 100
    }
  ],
  "shippingInfo": {
    "recipientName": "John Doe",
    "phone": "+66123456789",
    "address": "123 Main St, Bangkok, Thailand 10110",
    "notes": "Leave at front desk"
  },
  "paymentMethod": "CREDIT_CARD"
}
```

**Expected Response:**
```json
{
  "id": 1,
  "buyerId": 2,
  "status": "PENDING",
  "totalAmount": 800,
  "shippingAddress": "123 Main St, City, State 12345",
  "paymentMethod": "CREDIT_CARD",
  "items": [
    {
      "id": 1,
      "productId": 1,
      "quantity": 1,
      "priceAtTime": 800,
      "product": { ... }
    }
  ]
}
```

### 2. Get My Purchases
```bash
GET http://localhost:3000/transaction/my-purchases
Authorization: Bearer YOUR_JWT_TOKEN
```

### 3. Get My Sales
```bash
GET http://localhost:3000/transaction/my-sales
Authorization: Bearer YOUR_JWT_TOKEN
```

### 4. Get Transaction Details
```bash
GET http://localhost:3000/transaction/1
Authorization: Bearer YOUR_JWT_TOKEN
```

### 5. Get My Transaction Items
```bash
GET http://localhost:3000/transaction/my-items
Authorization: Bearer YOUR_JWT_TOKEN
```

### 6. Get My Transaction Statistics
```bash
GET http://localhost:3000/transaction/my-stats
Authorization: Bearer YOUR_JWT_TOKEN
```

### 7. Update Transaction Status
```bash
PATCH http://localhost:3000/transaction/1
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "status": "SHIPPED"
}
```

### 8. Update Transaction Item Status
```bash
PATCH http://localhost:3000/transaction/item/1
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "status": "DELIVERED"
}
```

### 9. Create Payment Intent
```bash
POST http://localhost:3000/transaction/payment-intent
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "transactionId": 1
}
```

### 10. Confirm Payment
```bash
POST http://localhost:3000/transaction/confirm-payment/1
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "paymentIntentId": "pi_mock_payment_intent_123"
}
```

## 🧪 Testing Scenarios

### Scenario 1: Complete Purchase Flow
1. Register two users (buyer and seller)
2. Login as seller, create a product
3. Login as buyer, create transaction
4. Create payment intent
5. Confirm payment
6. Check transaction status

### Scenario 2: Multi-item Transaction
Create a transaction with multiple products:
```json
{
  "items": [
    {
      "productId": "bb31023e-cff7-4e63-8ac9-b537d455d2a8",
      "quantity": 1,
      "unitPrice": 800
    },
    {
      "productId": "cc41023e-cff7-4e63-8ac9-b537d455d2a9",
      "quantity": 2,
      "unitPrice": 50
    }
  ],
  "shippingInfo": {
    "recipientName": "John Doe",
    "phone": "+66123456789",
    "address": "123 Main St, Bangkok, Thailand 10110"
  },
  "paymentMethod": "CREDIT_CARD"
}
```

### Scenario 3: Error Testing
- Try creating transaction without auth token (should get 401)
- Try accessing other user's transactions (should get 403)
- Try creating transaction with invalid product ID
- Try creating transaction with insufficient stock

## 🔍 Common Issues & Solutions

### Issue: 401 Unauthorized
- **Cause**: Missing or invalid JWT token
- **Solution**: Make sure Authorization header is set correctly

### Issue: 403 Forbidden  
- **Cause**: Trying to access resources you don't own
- **Solution**: Use correct user token for the resource

### Issue: Product not found
- **Cause**: Invalid productId in transaction
- **Solution**: Create products first or use existing product IDs

### Issue: Insufficient stock
- **Cause**: Requesting more quantity than available
- **Solution**: Check product quantity before creating transaction

## 📊 Database Verification

After testing, you can verify the data in your database:

```sql
-- Check transactions
SELECT * FROM transaction;

-- Check transaction items
SELECT * FROM transaction_item;

-- Check updated product quantities
SELECT id, title, quantity, isAvailable FROM product;
```

## 🚀 Next Steps

After basic testing works:
1. Implement real payment gateway (Stripe/PayPal)
2. Add email notifications
3. Add order tracking
4. Add refund functionality
5. Add bulk operations

Happy testing! 🎉
