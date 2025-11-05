"""
Temporary script to load data from legacy YAML files into Django models.
Usage: python manage.py load_legacy_data [--username USERNAME] [--email EMAIL]
"""
import re
import yaml
from pathlib import Path
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from cv.models import Education, ProfessionalExperience, Publication, Award


def parse_years(years_str):
    """
    Parse years string like "2021-present", "2016-2021", or "2015" into start_year and end_year.
    Returns (start_year, end_year) where end_year is None if "present".
    """
    if not years_str:
        return None, None

    # Convert to string if it's an integer
    if isinstance(years_str, int):
        return years_str, years_str

    # Convert to string for processing
    years_str = str(years_str)

    # Handle "present" case
    if 'present' in years_str.lower():
        match = re.search(r'(\d{4})', years_str)
        if match:
            return int(match.group(1)), None
        return None, None

    # Handle range like "2016-2021"
    range_match = re.search(r'(\d{4})\s*-\s*(\d{4})', years_str)
    if range_match:
        return int(range_match.group(1)), int(range_match.group(2))

    # Handle single year
    single_match = re.search(r'(\d{4})', years_str)
    if single_match:
        year = int(single_match.group(1))
        return year, year

    return None, None


def parse_date_to_year(date_str):
    """
    Extract year from date string like "August 2024", "2017", "Fall 2013", etc.
    Also handles integer years directly.
    """
    if not date_str:
        return None
    # If it's already an integer year, return it
    if isinstance(date_str, int):
        return date_str
    # Convert to string for processing
    date_str = str(date_str)
    # Try to find a 4-digit year
    year_match = re.search(r'\b(\d{4})\b', date_str)
    if year_match:
        return int(year_match.group(1))
    return None


class Command(BaseCommand):
    help = 'Load data from legacy YAML files into Django models'

    def add_arguments(self, parser):
        parser.add_argument(
            '--username',
            type=str,
            default='default_user',
            help='Username for the user to associate data with (default: default_user)',
        )
        parser.add_argument(
            '--email',
            type=str,
            default='default@example.com',
            help='Email for the user (default: default@example.com)',
        )
        parser.add_argument(
            '--data-file',
            type=str,
            default='legacy-scripts/mydata/data.yml',
            help='Path to data.yml file (relative to project root)',
        )
        parser.add_argument(
            '--refs-file',
            type=str,
            default='legacy-scripts/mydata/refs.yml',
            help='Path to refs.yml file (relative to project root)',
        )
        parser.add_argument(
            '--clear-existing',
            action='store_true',
            help='Clear existing data for this user before loading',
        )

    def handle(self, *args, **options):
        # Get or create user
        username = options['username']
        email = options['email']

        user, created = User.objects.get_or_create(
            username=username,
            defaults={'email': email}
        )

        if created:
            self.stdout.write(self.style.SUCCESS(f'Created user: {username}'))
        else:
            self.stdout.write(self.style.SUCCESS(f'Using existing user: {username}'))

        # Clear existing data if requested
        if options['clear_existing']:
            Education.objects.filter(user=user).delete()
            ProfessionalExperience.objects.filter(user=user).delete()
            Publication.objects.filter(user=user).delete()
            Award.objects.filter(user=user).delete()
            self.stdout.write(self.style.WARNING('Cleared existing data for user'))

        # Get project root (assuming we're in backend directory)
        project_root = Path(__file__).resolve().parent.parent.parent.parent
        data_file = project_root / options['data_file']
        refs_file = project_root / options['refs_file']

        # Load data.yml (handle multiple YAML documents)
        self.stdout.write(f'Loading data from {data_file}...')
        with open(data_file, 'r') as f:
            # Load all documents and merge them (usually there's just one or two)
            documents = list(yaml.safe_load_all(f))
            if len(documents) > 1:
                # Merge multiple documents into one dict
                data = {}
                for doc in documents:
                    if doc:
                        data.update(doc)
            else:
                data = documents[0] if documents else {}

        # Load education
        if 'education' in data:
            self.stdout.write('Loading education...')
            for edu in data['education']:
                # Handle missing location field - use empty string
                # Location is required in model but not in YAML
                location = edu.get('location', '')

                # Handle missing field_of_study (some entries might not have subject)
                field_of_study = edu.get('subject', edu.get('field_of_study', ''))

                school_name = edu.get('school', '')
                grad_year = edu.get('year', 0)
                degree_type = edu.get('degree', '')

                if school_name and grad_year and degree_type:
                    Education.objects.get_or_create(
                        user=user,
                        school_name=school_name,
                        grad_year=grad_year,
                        degree_type=degree_type,
                        defaults={
                            'location': location,
                            'field_of_study': field_of_study,
                        }
                    )
            self.stdout.write(self.style.SUCCESS(f'  Loaded {Education.objects.filter(user=user).count()} education records'))

        # Load experience
        if 'experience' in data:
            self.stdout.write('Loading professional experience...')
            for exp in data['experience']:
                years_str = exp.get('years', '')
                start_year, end_year = parse_years(years_str)

                if start_year:
                    ProfessionalExperience.objects.get_or_create(
                        user=user,
                        title=exp.get('title', ''),
                        institution=exp.get('employer', ''),
                        start_year=start_year,
                        defaults={
                            'end_year': end_year,
                        }
                    )
            self.stdout.write(self.style.SUCCESS(f'  Loaded {ProfessionalExperience.objects.filter(user=user).count()} experience records'))

        # Load awards (from honor section)
        if 'honor' in data:
            self.stdout.write('Loading awards...')
            for honor in data['honor']:
                name = honor.get('name', '')
                date_str = honor.get('date', '')
                year = parse_date_to_year(date_str)

                if name and year:
                    Award.objects.get_or_create(
                        user=user,
                        name=name,
                        year=year,
                    )
            self.stdout.write(self.style.SUCCESS(f'  Loaded {Award.objects.filter(user=user).count()} award records'))

        # Load publications from refs.yml (handle multiple YAML documents)
        self.stdout.write(f'Loading publications from {refs_file}...')
        with open(refs_file, 'r') as f:
            # Load all documents and merge them
            documents = list(yaml.safe_load_all(f))
            if len(documents) > 1:
                # Merge multiple documents into one dict
                refs_data = {}
                for doc in documents:
                    if doc:
                        refs_data.update(doc)
            else:
                refs_data = documents[0] if documents else {}

        if 'papers' in refs_data:
            self.stdout.write('Loading publications...')
            for paper in refs_data['papers']:
                doi = paper.get('doi', '')
                if doi:
                    # Strip any whitespace and ensure it's a valid DOI format
                    doi = doi.strip()
                    Publication.objects.get_or_create(
                        user=user,
                        doi=doi,
                    )
            self.stdout.write(self.style.SUCCESS(f'  Loaded {Publication.objects.filter(user=user).count()} publication records'))

        self.stdout.write(self.style.SUCCESS('\nData loading complete!'))
        self.stdout.write(f'\nSummary for user {username}:')
        self.stdout.write(f'  Education: {Education.objects.filter(user=user).count()}')
        self.stdout.write(f'  Professional Experience: {ProfessionalExperience.objects.filter(user=user).count()}')
        self.stdout.write(f'  Awards: {Award.objects.filter(user=user).count()}')
        self.stdout.write(f'  Publications: {Publication.objects.filter(user=user).count()}')

