# Role-Based Authorization System

This system provides role-based access control (RBAC) for the Library Management API.

## User Roles

- **STUDENT**: Can borrow books and view their own information
- **TEACHER**: Can borrow books and view their own information  
- **LIBRARIAN**: Can manage books, loans, and view user information
- **ADMIN**: Full access to all resources

## How to Use

### 1. Protect Routes with Authentication

```typescript
@UseGuards(JwtAuthGuard)
@Get('protected-route')
getProtectedData() {
  return 'This route requires authentication';
}
```

### 2. Protect Routes with Role-Based Authorization

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.LIBRARIAN, UserRole.ADMIN)
@Post('books')
createBook(@Body() dto: CreateBookDto) {
  return this.bookService.create(dto);
}
```

### 3. Get Current User Information

```typescript
@UseGuards(JwtAuthGuard)
@Get('me')
getCurrentUser(@CurrentUser() user: any) {
  return { user };
}
```

## API Endpoints with Role Restrictions

### Books
- **GET /book** - Public (anyone can view books)  
- **POST /book** - LIBRARIAN, ADMIN only
- **PATCH /book/:id** - LIBRARIAN, ADMIN only  
- **DELETE /book/:id** - LIBRARIAN, ADMIN only
- **PATCH /book/:id/unarchive** - LIBRARIAN, ADMIN only

### Users
- **POST /user** - ADMIN only
- **GET /user** - LIBRARIAN, ADMIN only
- **GET /user/me** - Any authenticated user (own profile)
- **GET /user/:id** - LIBRARIAN, ADMIN only
- **PATCH /user/:id** - LIBRARIAN, ADMIN only
- **DELETE /user/:id** - ADMIN only

### Loans
- **POST /loan/borrow** - Any authenticated user
- **PATCH /loan/:id/return** - LIBRARIAN, ADMIN only
- **PATCH /loan/:id/renew** - LIBRARIAN, ADMIN only
- **GET /loan/all** - LIBRARIAN, ADMIN only
- **GET /loan/user/:userId** - LIBRARIAN, ADMIN only
- **GET /loan/overdue** - LIBRARIAN, ADMIN only

### Auth
- **POST /auth/register** - Public
- **POST /auth/verify-email** - Public
- **POST /auth/login** - Public
- **GET /auth/me** - Any authenticated user

## Testing Authorization

### 1. Register and Login as Different Roles

```bash
# Register as a student
POST /auth/register
{
  "name": "John Student",
  "email": "student@example.com", 
  "password": "password123",
  "role": "STUDENT"
}

# Register as a librarian
POST /auth/register
{
  "name": "Jane Librarian",
  "email": "librarian@example.com",
  "password": "password123", 
  "role": "LIBRARIAN"
}
```

### 2. Test Role Restrictions

**Student trying to create a book (should fail):**
```bash
POST /book
Authorization: Bearer <student_access_token>
{
  "title": "Test Book",
  "author": "Test Author",
  "genre": "FICTION",
  "publishedAt": "2023-01-01T00:00:00.000Z"
}
# Response: 403 Forbidden - "User with role 'STUDENT' is not authorized..."
```

**Librarian creating a book (should succeed):**
```bash
POST /book
Authorization: Bearer <librarian_access_token>
{
  "title": "Test Book",
  "author": "Test Author", 
  "genre": "FICTION",
  "publishedAt": "2023-01-01T00:00:00.000Z"
}
# Response: 201 Created
```

## Error Messages

- **401 Unauthorized**: Invalid or missing JWT token
- **403 Forbidden**: User doesn't have required role
- **404 Not Found**: Resource not found
- **400 Bad Request**: Invalid request data

## Security Features

- JWT tokens with expiration
- Role-based access control
- Password hashing with bcrypt
- Email verification required for login
- Refresh token rotation
- Secure logout (clears refresh token)
