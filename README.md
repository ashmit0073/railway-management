# Railway Management System API

A REST API for a railway management system like IRCTC where users can search trains, check seat availability, and book tickets.

## Features

- User Authentication (Register/Login)
- Role-based access (Admin/User)
- Train Management (Add/Update trains - Admin only)
- Search trains between stations
- Real-time seat availability checking
- Secure ticket booking with race condition handling
- View booking details

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v8.0 or higher)
- npm (Node Package Manager)

## Setup Instructions

1. Clone the repository
```bash
git clone https://github.com/ashmit0073/railway-management.git
cd railway-management
```

2. Install dependencies
```bash
npm install
```

3. Set up the database
- Open MySQL Workbench
- Connect to your MySQL server
- Run the following SQL commands to create the database and tables:

```sql
CREATE DATABASE IF NOT EXISTS railway_db;
USE railway_db;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(10) NOT NULL DEFAULT 'user'
);

CREATE TABLE trains (
    id INT AUTO_INCREMENT PRIMARY KEY,
    train_number VARCHAR(20) UNIQUE NOT NULL,
    train_name VARCHAR(100) NOT NULL,
    source VARCHAR(100) NOT NULL,
    destination VARCHAR(100) NOT NULL,
    total_seats INT NOT NULL
);

CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    train_id INT,
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    seat_number INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (train_id) REFERENCES trains(id),
    UNIQUE KEY unique_seat (train_id, seat_number)
);

CREATE INDEX idx_trains_source_destination ON trains(source, destination);
```

4. Create a .env file in the root directory with the following content:
```
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=railway_db

JWT_SECRET=your_jwt_secret
ADMIN_API_KEY=your_admin_api_key
PORT=3000
```

5. Start the server
```bash
npm start
```

## API Endpoints

### Authentication

- Register: `POST /api/auth/register`
```json
{
    "username": "testuser",
    "password": "password123"
}
```

- Login: `POST /api/auth/login`
```json
{
    "username": "testuser",
    "password": "password123"
}
```

### Trains

- Add Train (Admin): `POST /api/trains`
```json
{
    "train_number": "12345",
    "train_name": "Express",
    "source": "Delhi",
    "destination": "Mumbai",
    "total_seats": 100
}
```
Headers: `X-API-KEY: your_admin_api_key`

- Search Trains: `GET /api/trains/search?source=Delhi&destination=Mumbai`

### Bookings

- Book Seat: `POST /api/bookings`
```json
{
    "train_id": 1
}
```
Headers: `Authorization: Bearer your_jwt_token`

- View All Bookings: `GET /api/bookings`
Headers: `Authorization: Bearer your_jwt_token`

- View Specific Booking: `GET /api/bookings/:id`
Headers: `Authorization: Bearer your_jwt_token`

## Assumptions

1. Each train has a fixed number of seats
2. Seat numbers are assigned automatically in sequential order
3. Users can only view their own bookings
4. Admin authentication is done via API key
5. JWT tokens expire after 24 hours

## Error Handling

The API returns appropriate HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## Security Features

1. Password hashing using bcrypt
2. JWT-based authentication
3. API key protection for admin routes
4. SQL injection prevention
5. Race condition handling in bookings

## Author

Ashmit
