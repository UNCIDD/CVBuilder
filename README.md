# CVBuilder

## Quick Start for Development

### Prerequisites

- Python 3.13+
- [Poetry](https://python-poetry.org/docs/#installing-with-the-official-installer)

### Setup & Run

```bash
# Navigate to backend
cd backend

# Install dependencies
poetry install

# Run migrations
poetry run python manage.py migrate

# Create admin user
poetry run python manage.py createsuperuser

# Start development server
poetry run python manage.py runserver
```

Access the application at http://127.0.0.1:8000/

### Common Commands

```bash
# Add new dependencies
poetry add <package-name>

# Run migrations after model changes
poetry run python manage.py makemigrations
poetry run python manage.py migrate

# Run tests
poetry run python manage.py test
```

## Project Structure

- `backend/` - Django application
  - `accounts/` - User authentication
  - `cv/` - CV management
  - `templates_engine/` - Template system
  - `importers/` - Data import
  - `exports/` - Export functionality

## License

See [LICENSE](LICENSE) file for details.
