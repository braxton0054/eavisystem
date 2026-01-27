# Fee PDF Storage

This directory contains all fee structure PDFs for courses in the admission system.

## File Structure

- Fee PDFs are stored with timestamp prefixes to ensure unique filenames
- Example: `164099520000_sample_fee_structure.pdf`
- Each PDF is associated with a specific course in the database

## API Integration

### Upload Fee PDF
- **Endpoint**: `POST /api/{campus}/fees/upload`
- **File**: Multipart form data with 'feePdf' field
- **Metadata**: courseId, feeName, description

### Download Fee PDF
- **Endpoint**: `GET /api/{campus}/fees/download/{filename}`
- **Returns**: PDF file for download/viewing

### List Fee PDFs
- **Endpoint**: `GET /api/{campus}/fees`
- **Returns**: List of all fee PDFs with course information

## File Naming Convention

Files are named using the pattern: `{timestamp}_{original_name}`

Example:
- Original: `computer-science-fees.pdf`
- Stored: `164099520000_computer-science-fees.pdf`

## Security

- Only PDF files are accepted
- Maximum file size: 10MB
- Files are validated before storage
- Access requires admin authentication

## Database Integration

Fee PDF information is stored in the `courses` table:
- `fee_pdf_path`: Filename of the stored PDF
- `fee_name`: Display name for the fee document
- `fee_description`: Optional description
- `updated_at`: Last update timestamp

## Usage

1. **Upload New Fee PDF**: Use the course management interface to upload a new PDF
2. **Select Existing PDF**: Choose from previously uploaded PDFs
3. **View Fee PDFs**: Click on fee document links in the courses table to view/download
4. **Manage PDFs**: Update or remove fee PDFs as needed

## Cleanup

- Old PDF files are automatically deleted when updated
- Database references are cleaned up when courses are deleted
- Orphaned files should be manually cleaned up periodically
