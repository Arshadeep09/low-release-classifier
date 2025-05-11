# Slow Release Classifier

A web application that determines whether a given feature or enhancement should be classified as part of a Slow Release channel, based on an uploaded SOP document.

## Features

- Admin interface for uploading and managing SOP documents
- Feature classification using LLM analysis
- Support for both file uploads and text input
- Detailed justifications with SOP section references
- Role-based access control

## Prerequisites

- Node.js 18.x or later
- npm 9.x or later
- OpenAI API key

## Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd slow-release-classifier
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory with the following variables:
   ```
   OPENAI_API_KEY=your_openai_api_key
   ```

4. Create the required directories:
   ```bash
   mkdir -p uploads/sop uploads/temp
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3000`.

## Usage

### Admin Access

1. Log in with admin credentials
2. Navigate to the admin dashboard
3. Upload new SOP documents (PDF or DOCX)
4. Set the active SOP version

### Feature Classification

1. Log in with user credentials
2. Navigate to the classification page
3. Either:
   - Upload a PRD file (PDF, DOCX, or TXT)
   - Paste the feature description
4. Submit for classification
5. Review the results, including:
   - Classification outcome
   - Justification
   - Referenced SOP sections

## Development

### Project Structure

```
src/
  ├── app/                 # Next.js app directory
  │   ├── api/            # API routes
  │   ├── dashboard/      # Dashboard pages
  │   └── login/          # Login page
  ├── components/         # React components
  │   ├── auth/          # Authentication components
  │   └── dashboard/     # Dashboard components
  └── lib/               # Utility functions
```

### Adding New Features

1. Create new components in the `src/components` directory
2. Add new API routes in the `src/app/api` directory
3. Update the UI in the respective page components

## Security Considerations

- All file uploads are validated for type and size
- Authentication is required for all operations
- Role-based access control is enforced
- Files are stored securely and cleaned up after processing

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
