# College Admission System Backend

A comprehensive backend system for managing college/university applications with dual campus support (West Campus & Twon Campus).

## Features

- **Dual Campus Support**: Separate databases for West and Twon campuses
- **Student Registration**: Complete student admission process
- **PDF Generation**: Automatic admission letter generation
- **Email Notifications**: Automated emails with PDF attachments
- **Course Management**: Manage courses and departments per campus
- **PostgreSQL Database**: Robust database with connection pooling
- **Security**: Rate limiting, input validation, secure authentication

## Tech Stack

- **Node.js** with **Express.js**
- **PostgreSQL** with **pg** connection pooling
- **PDF-lib** for PDF generation
- **nodemailer** for email services
- **bcryptjs** for password hashing
- **express-validator** for input validation

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on the provided template:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your configuration:
   - West Campus PostgreSQL connection details
   - Twon Campus PostgreSQL connection details
   - Email configuration
   - PDF template paths

## Environment Variables

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database - West Campus
WEST_DB_HOST=your-west-neon-host
WEST_DB_PORT=5432
WEST_DB_NAME=your-west-db-name
WEST_DB_USER=your-west-db-user
WEST_DB_PASSWORD=your-west-db-password
WEST_DB_SSL=true

# Database - Twon Campus
TWON_DB_HOST=your-town-neon-host
TWON_DB_PORT=5432
TWON_DB_NAME=your-town-db-name
TWON_DB_USER=your-town-db-user
TWON_DB_PASSWORD=your-town-db-password
TWON_DB_SSL=true

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
EMAIL_FROM=noreply@college.edu

# PDF Templates
PDF_TEMPLATE_WEST=./templates/west_admission_template.pdf
PDF_TEMPLATE_TWON=./templates/twon_admission_template.pdf
```

## Database Setup

1. **Set up PostgreSQL databases** (Neon recommended):
   - Create two separate databases: one for West Campus, one for Twon Campus
   - Update connection details in `.env`

2. **Run database setup scripts**:
   ```bash
   npm run setup:west
   npm run setup:twon
   ```

3. **Create PDF templates**:
   - Place `west_admission_template.pdf` and `twon_admission_template.pdf` in the `templates/` directory
   - Templates should have placeholder positions for student information

## API Endpoints

### Student Endpoints

#### West Campus
- `POST /api/west/students/register` - Register new student
- `GET /api/west/students/:admissionNumber` - Get student details
- `GET /api/west/students/download/:admissionNumber` - Download admission PDF
- `GET /api/west/students` - Get all students (paginated)
- `PUT /api/west/students/:admissionNumber/status` - Update student status

#### Twon Campus
- `POST /api/twon/students/register` - Register new student
- `GET /api/twon/students/:admissionNumber` - Get student details
- `GET /api/twon/students/download/:admissionNumber` - Download admission PDF
- `GET /api/twon/students` - Get all students (paginated)
- `PUT /api/twon/students/:admissionNumber/status` - Update student status

### Course Endpoints

#### West Campus
- `POST /api/west/courses` - Create new course
- `GET /api/west/courses` - Get all courses
- `GET /api/west/courses/:courseId` - Get course by ID
- `PUT /api/west/courses/:courseId` - Update course
- `DELETE /api/west/courses/:courseId` - Delete course

#### Twon Campus
- `POST /api/twon/courses` - Create new course
- `GET /api/twon/courses` - Get all courses
- `GET /api/twon/courses/:courseId` - Get course by ID
- `PUT /api/twon/courses/:courseId` - Update course
- `DELETE /api/twon/courses/:courseId` - Delete course

### System Endpoints
- `GET /health` - Health check endpoint

## Student Registration Flow

1. **Submit Application**: POST to `/api/{campus}/students/register`
2. **Automatic Processing**:
   - Generate unique admission number
   - Create student record in campus database
   - Generate admission PDF
   - Send confirmation email with PDF attachment
3. **Response**: Returns student details and admission number

## Student Status Flow

- `pending` - Application received, under review
- `admitted` - Application approved
- `rejected` - Application denied

## Database Schema

### Tables per Campus
- **admins**: Admin users for campus management
- **departments**: Academic departments
- **courses**: Available courses with fees
- **students**: Student applications and records
- **admission_history**: Audit trail for student actions

## Running the Application

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Database Setup
```bash
npm run setup:west  # Setup West Campus database
npm run setup:twon  # Setup Twon Campus database
```

## Project Structure

```
backend/
├── src/
│   ├── config/          # Database configuration
│   ├── controllers/     # Route handlers
│   ├── models/          # Database models (Student, Course)
│   ├── routes/          # API routes
│   ├── services/        # Business logic (PDF, Email)
│   └── middlewares/     # Custom middleware
├── sql/                 # Database schema files
├── scripts/             # Database setup scripts
├── templates/           # PDF templates
├── generated_pdfs/      # Generated PDF storage
├── .env                 # Environment variables
├── package.json         # Dependencies and scripts
└── server.js            # Main server file
```

## Security Features

- Rate limiting to prevent abuse
- Input validation and sanitization
- CORS configuration
- Helmet.js for security headers
- SSL database connections
- Password hashing for admin accounts

## Sample Usage

### Register a Student (West Campus)
```bash
curl -X POST http://localhost:5000/api/west/students/register \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "John Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "date_of_birth": "2000-01-01",
    "address": "123 Main St, City, State",
    "course_id": 1
  }'
```

### Get Student Details
```bash
curl http://localhost:5000/api/west/students/WEST241234
```

### Get All Courses (West Campus)
```bash
curl http://localhost:5000/api/west/courses
```

## Next Steps

1. **Set up Neon Databases**: Create two separate Neon databases
2. **Create PDF Templates**: Design admission letter templates
3. **Configure Email**: Set up SMTP credentials
4. **Test APIs**: Use Postman or similar tool
5. **Add Authentication**: Implement JWT-based admin authentication
6. **Create Frontend**: Build web interface for students and admins

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
