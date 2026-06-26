# API Documentation

## Base URL
The API is served under the `/api/` prefix.

Example:
- `https://mindfulnesssupplies.com/api/`

## Authentication
### Login
`POST /api/auth/login/`

Request body:
```json
{
  "username": "admin",
  "password": "password123"
}
```

Response body:
```json
{
  "refresh": "<token>",
  "access": "<token>",
  "is_admin": true,
  "is_branch": false,
  "branch_id": null
}
```

## Endpoints
### Branches
`GET /api/branches/`
`POST /api/branches/`
`GET /api/branches/{id}/`
`PUT /api/branches/{id}/`
`DELETE /api/branches/{id}/`

Fields:
- `id`
- `name`
- `location`

### Items
`GET /api/items/`
`POST /api/items/`
`GET /api/items/{id}/`
`PUT /api/items/{id}/`
`DELETE /api/items/{id}/`

Fields:
- `id`
- `name`

### Inventory
`GET /api/inventory/`
`POST /api/inventory/`
`GET /api/inventory/{id}/`
`PUT /api/inventory/{id}/`
`DELETE /api/inventory/{id}/`

Fields:
- `id`
- `branch`
- `branch_id`
- `item`
- `item_id`
- `quantity`
- `price`

Search support:
- `?search={item_name}`
- `?branch_id={branch_id}`

### Sales
`GET /api/sales/`
`POST /api/sales/`
`GET /api/sales/{id}/`
`PUT /api/sales/{id}/`
`DELETE /api/sales/{id}/`

Fields:
- `id`
- `branch`
- `branch_id`
- `item`
- `item_id`
- `quantity`
- `price`
- `total_amount`
- `payment_method`
- `timestamp`

### Dashboard Summary
`GET /api/dashboard-summary/`

Response example:
```json
{
  "total_stock": 432,
  "total_sales": 1290.50,
  "low_stock_alerts": 7
}
```

### Stock Management
#### Stock In
`POST /api/inventory/stock-in/`

Request body:
```json
{
  "branch_id": 2,
  "item_id": 4,
  "quantity": 20
}
```

#### Stock Out
`POST /api/inventory/stockout/`

Request body:
```json
{
  "from_branch_id": 2,
  "to_branch_id": 3,
  "item_id": 4,
  "quantity": 10
}
```

## Permissions
- Admin users can access all branches, inventory, and sales data.
- Branch users are limited to their assigned branch.
- Stock out operations are available to users with `can_stock` permission or admins.

## Notes
- Sales creation validates inventory availability and deducts stock automatically.
- Inventory records include branch-specific price and quantity.
- JWT authentication is required for protected endpoints.
