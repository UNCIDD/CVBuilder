# CVBuilder

A web application for creating professional biographical sketches (biosketches) with publications, education, and experience.

Note: at this point built verion seems to work, but some issues with the dev run.

## Quick Start

### Prerequisites

- Python 3.9+ (for backend)
- [Poetry](https://python-poetry.org/docs/#installing-with-the-official-installer) (for backend)
- Node.js and npm (for frontend)

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
poetry install

# Run database migrations
poetry run python manage.py migrate

# Create a superuser (you'll be prompted for username and password)
poetry run python manage.py createsuperuser

# Start the development server
poetry run python manage.py runserver
```

The backend API will be available at http://127.0.0.1:8000/

### Frontend Setup

```bash
# Navigate to frontend directory (from project root)
cd cvbuilder-frontend

# Install dependencies
npm install
  
# Start the development server
npm run dev
```

The frontend will be available at http://localhost:3000 (or the next available port)

### Login

You can log in using either:

- **Superuser credentials**: Use the username and password you created with `createsuperuser`
- **New account**: Create a new account directly from the signup page (no email required, just username and password)

### Common Commands

**Backend:**

```bash
# Add new dependencies
poetry add <package-name>

# Run migrations after model changes
poetry run python manage.py makemigrations
poetry run python manage.py migrate

# Run tests
poetry run python manage.py test
```

**Frontend:**

```bash
# Build for production
npm run build

# Run production build
npm start
```

## Project Structure

- `backend/` - Django REST API
  - `accounts/` - User authentication
  - `cv/` - CV/biosketch management
- `cvbuilder-frontend/` - Next.js frontend application

## License

See [LICENSE](LICENSE) file for details.
