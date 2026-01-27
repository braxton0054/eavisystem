# Admin Dashboard - Backend Data Integration

## Overview
The admin dashboard is fully integrated with the backend to receive data from both campuses (West and Twon). All frontend pages are configured to fetch real data from the backend APIs.

## Campus Handling
- **Authentication**: Admin users are authenticated and assigned to a specific campus
- **Data Isolation**: Each campus has its own database and data is isolated
- **URL Structure**: All API endpoints use the campus parameter (`/api/{campus}/...`)
- **Validation**: Campus validation ensures only 'west' or 'twon' are accepted

## API Endpoints

### Student Management
- `GET /api/{campus}/students` - Get all students with pagination and filters
- `GET /api/{campus}/students/download/{admissionNumber}` - Download admission PDF
- `POST /api/{campus}/students/register` - Register new student

### Course Management
- `GET /api/{campus}/courses` - Get all courses
- `GET /api/{campus}/departments` - Get all departments
- `POST /api/{campus}/courses` - Create new course
- `PUT /api/{campus}/courses/{courseId}` - Update course

### Authentication
- `POST /api/{campus}/admin/login` - Admin login
- All protected routes require JWT token and campus validation

## Frontend Pages with Backend Integration

### 1. Dashboard (`index.html`)
- **Data**: Student statistics (total, pending, admitted, rejected)
- **API**: `GET /api/{campus}/students?page=1&limit=1000`
- **Features**: Real-time statistics, recent students display
- **Campus**: Uses authenticated admin's campus

### 2. Students Management (`students.html`)
- **Data**: Student list with pagination, search, and filters
- **API**: `GET /api/{campus}/students?page={page}&limit={limit}&filters...`
- **Features**: Search by name/admission number, filter by status/course
- **Campus**: Uses authenticated admin's campus

### 3. Course Management (`courses.html`)
- **Data**: Course list, departments, course statistics
- **API**: `GET /api/{campus}/courses`, `GET /api/{campus}/departments`
- **Features**: Add/edit courses, department management
- **Campus**: Uses authenticated admin's campus

### 4. Add Student (`add-student.html`)
- **Data**: Courses and departments for dropdowns
- **API**: `GET /api/{campus}/courses`, `GET /api/{campus}/departments`
- **Features**: Manual student registration with course selection
- **Campus**: Uses authenticated admin's campus

### 5. Print Records (`print-records.html`)
- **Data**: Students, courses for filtering and reporting
- **API**: `GET /api/{campus}/students`, `GET /api/{campus}/courses`
- **Features**: Generate reports, print student records
- **Campus**: Uses authenticated admin's campus

### 6. Reporting Dates (`reporting-dates.html`)
- **Data**: Student data for term assignment
- **API**: `GET /api/{campus}/students`, `GET /api/{campus}/courses`
- **Features**: Academic term management, student assignment
- **Campus**: Uses authenticated admin's campus

### 7. WhatsApp Share (`whatsapp-share.html`)
- **Data**: Students with phone numbers and PDF status
- **API**: `GET /api/{campus}/students`, PDF download links
- **Features:**
  - Share admission PDFs via WhatsApp
  - Uses backend-generated PDF URLs: `/api/{campus}/students/download/{admissionNumber}`
  - Default message: "Dear [Name], Your admission letter has been generated. Download your PDF here: [PDF Link]"
- **Campus**: Uses authenticated admin's campus

## Data Flow

### Authentication Flow
1. Admin logs in → JWT token generated with campus info
2. Token stored in localStorage
3. All API requests include token in Authorization header
4. Backend validates token and campus for each request

### Data Loading Flow
1. Page loads → `checkAuth()` validates token and sets campus
2. Campus validated (west/twon only)
3. API calls made with campus-specific URLs
4. Data fetched and displayed in UI
5. Error handling with user notifications

### Error Handling
- **Authentication**: Redirect to login if token invalid
- **Network**: Show error messages for API failures
- **Validation**: Campus validation prevents cross-campus access
- **UI**: Graceful fallbacks for missing data

## Campus-Specific Features

### West Campus
- Database: `west_campus`
- Admin users: Assigned to 'west' campus
- Data isolation: Only West campus data accessible

### Twon Campus  
- Database: `twon_campus`
- Admin users: Assigned to 'twon' campus
- Data isolation: Only Twon campus data accessible

## Security Features

### Campus Validation
- Middleware validates campus parameter in all routes
- Only 'west' or 'twon' allowed
- Prevents cross-campus data access

### Token Validation
- JWT tokens include campus information
- Session validation in database
- Token expiration handling

### Role-Based Access
- Admin and super_admin roles
- Protected routes require authentication
- Role-based authorization middleware

## Configuration

### API Base URL
```javascript
const API_BASE_URL = '/api';
```

### Campus Detection
```javascript
const currentCampus = currentUser.campus; // 'west' or 'twon'
```

### Request Headers
```javascript
headers: {
    'Authorization': `Bearer ${token}`
}
```

## Testing

### Test Both Campuses
1. Login as West campus admin → verify West data only
2. Login as Twon campus admin → verify Twon data only
3. Verify no cross-campus data access
4. Test all pages with both campuses

### API Testing
- Use Postman or similar tool
- Test all endpoints with both campuses
- Verify authentication and authorization
- Test error scenarios

## Troubleshooting

### Common Issues
1. **No data displayed**: Check authentication token and campus
2. **Cross-campus access**: Verify campus validation middleware
3. **API errors**: Check backend logs and database connections
4. **PDF generation**: Verify PDF download endpoints

### Debug Logging
All frontend pages include console logging for:
- Campus detection
- API requests and responses
- Data loading statistics
- Error details

## Conclusion
The admin dashboard is fully integrated with the backend for both campuses, ensuring data isolation, security, and proper campus-specific data handling. All pages receive real data from the backend APIs with comprehensive error handling and user feedback.
