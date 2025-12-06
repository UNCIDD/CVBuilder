"""
Django management command to populate publication metadata from DOI.
Usage: python manage.py populate_publication_metadata [--user USERNAME] [--limit LIMIT] [--dry-run]
"""
import time
from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth.models import User
from django.db import models
from cv.models import Publication
from cv.views import fetch_doi_metadata


class Command(BaseCommand):
    help = 'Populate publication metadata (title, authors, journal, etc.) from DOI using Crossref API'

    def add_arguments(self, parser):
        parser.add_argument(
            '--user',
            type=str,
            help='Username to populate publications for (default: all users)',
        )
        parser.add_argument(
            '--limit',
            type=int,
            help='Limit the number of publications to process (useful for testing)',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be updated without actually updating',
        )
        parser.add_argument(
            '--delay',
            type=float,
            default=0.5,
            help='Delay between API calls in seconds (default: 0.5)',
        )

    def handle(self, *args, **options):
        username = options.get('user')
        limit = options.get('limit')
        dry_run = options.get('dry_run')
        delay = options.get('delay')

        # Get publications to update
        queryset = Publication.objects.filter(doi__isnull=False).exclude(doi='')
        
        if username:
            try:
                user = User.objects.get(username=username)
                queryset = queryset.filter(user=user)
                self.stdout.write(self.style.SUCCESS(f'Filtering publications for user: {username}'))
            except User.DoesNotExist:
                raise CommandError(f'User "{username}" does not exist.')

        # Filter to publications that need updating (missing title or other fields)
        queryset = queryset.filter(
            models.Q(title='') | models.Q(title__isnull=True) |
            models.Q(authors='') | models.Q(authors__isnull=True) |
            models.Q(journal='') | models.Q(journal__isnull=True)
        )

        total_count = queryset.count()
        
        if limit:
            queryset = queryset[:limit]
            self.stdout.write(f'Processing up to {limit} of {total_count} publications...')
        else:
            self.stdout.write(f'Processing {total_count} publications...')

        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No changes will be made'))

        updated_count = 0
        error_count = 0
        skipped_count = 0

        for publication in queryset:
            if not publication.doi:
                skipped_count += 1
                continue

            self.stdout.write(f'\nProcessing publication ID {publication.id}: {publication.doi}')

            try:
                metadata = fetch_doi_metadata(publication.doi)
                
                if metadata:
                    updated_count += 1
                    if dry_run:
                        self.stdout.write(f'  Would update:')
                        self.stdout.write(f'    Title: {metadata.get("title", "")[:50]}...')
                        self.stdout.write(f'    Authors: {metadata.get("authors", "")[:50]}...')
                        self.stdout.write(f'    Journal: {metadata.get("journal", "")[:50]}...')
                        self.stdout.write(f'    Year: {metadata.get("year")}')
                    else:
                        # Update fields only if they're empty or missing
                        if metadata.get('title') and not publication.title:
                            publication.title = metadata.get('title', '')
                        if metadata.get('authors') and not publication.authors:
                            publication.authors = metadata.get('authors', '')
                        if metadata.get('journal') and not publication.journal:
                            publication.journal = metadata.get('journal', '')
                        if metadata.get('year') and not publication.year:
                            publication.year = metadata.get('year')
                        if metadata.get('volume') and not publication.volume:
                            publication.volume = metadata.get('volume', '')
                        if metadata.get('issue') and not publication.issue:
                            publication.issue = metadata.get('issue', '')
                        if metadata.get('pages') and not publication.pages:
                            publication.pages = metadata.get('pages', '')
                        if metadata.get('citation') and not publication.citation:
                            publication.citation = metadata.get('citation', '')
                        
                        publication.save()
                        self.stdout.write(self.style.SUCCESS(f'  ✓ Updated publication {publication.id}'))
                else:
                    error_count += 1
                    self.stdout.write(self.style.WARNING(f'  ✗ Could not fetch metadata for {publication.doi}'))

                # Rate limiting - be nice to the API
                if delay > 0:
                    time.sleep(delay)

            except Exception as e:
                error_count += 1
                self.stdout.write(self.style.ERROR(f'  ✗ Error processing {publication.doi}: {str(e)}'))

        # Summary
        self.stdout.write(self.style.SUCCESS(f'\n{"="*60}'))
        self.stdout.write(self.style.SUCCESS('Summary:'))
        if dry_run:
            self.stdout.write(f'  Would update: {updated_count} publications')
        else:
            self.stdout.write(f'  Updated: {updated_count} publications')
        self.stdout.write(f'  Errors: {error_count} publications')
        self.stdout.write(f'  Skipped: {skipped_count} publications')
        self.stdout.write(f'  Total processed: {updated_count + error_count + skipped_count}')

