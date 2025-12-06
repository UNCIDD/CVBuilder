import subprocess
import tempfile
import requests
from pathlib import Path
from jinja2 import Environment, FileSystemLoader, select_autoescape
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.http import HttpResponse
from .models import Education, ProfessionalExperience, Publication, Award, PersonalStatement, Biosketch
from .serializers import (
    EducationSerializer,
    ProfessionalExperienceSerializer,
    PublicationSerializer,
    AwardSerializer,
    PersonalStatementSerializer,
    BiosketchSerializer,
    BiosketchRequestSerializer
)


class EducationViewSet(viewsets.ModelViewSet):
    serializer_class = EducationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Education.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ProfessionalExperienceViewSet(viewsets.ModelViewSet):
    serializer_class = ProfessionalExperienceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ProfessionalExperience.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


def fetch_doi_metadata(doi):
    """Fetch publication metadata from Crossref API using DOI"""
    try:
        url = f"https://api.crossref.org/works/{doi}"
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            data = response.json()
            message = data.get('message', {})

            title = message.get('title', [''])[0] if message.get('title') else ''

            authors_list = message.get('author', [])
            authors = ', '.join([
                f"{author.get('given', '')} {author.get('family', '')}".strip()
                for author in authors_list
            ])

            journal = message.get('container-title', [''])[0] if message.get('container-title') else ''

            year = None
            published_date = message.get('published-print') or message.get('published-online')
            if published_date and published_date.get('date-parts'):
                year = published_date['date-parts'][0][0] if published_date['date-parts'][0] else None

            volume = message.get('volume', '')
            issue = message.get('issue', '')
            pages = message.get('page', '')

            citation_url = f"https://citation.doi.org/format"
            citation_params = {'doi': doi, 'style': 'apa', 'lang': 'en-US'}
            citation_response = requests.get(citation_url, params=citation_params, timeout=10)
            citation = citation_response.text.strip() if citation_response.status_code == 200 else ''

            return {
                'title': title,
                'authors': authors,
                'journal': journal,
                'year': year,
                'volume': volume,
                'issue': issue,
                'pages': pages,
                'citation': citation
            }
        return None
    except Exception as e:
        return None


class PublicationViewSet(viewsets.ModelViewSet):
    serializer_class = PublicationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Publication.objects.filter(user=self.request.user)

        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(title__icontains=search)

        return queryset.order_by('-id')

    def perform_create(self, serializer):
        publication = serializer.save(user=self.request.user)
        if publication.doi:
            metadata = fetch_doi_metadata(publication.doi)
            if metadata:
                publication.title = metadata.get('title', '')
                publication.authors = metadata.get('authors', '')
                publication.journal = metadata.get('journal', '')
                publication.year = metadata.get('year')
                publication.volume = metadata.get('volume', '')
                publication.issue = metadata.get('issue', '')
                publication.pages = metadata.get('pages', '')
                if metadata.get('citation') and not publication.citation:
                    publication.citation = metadata.get('citation', '')
                publication.save()

    def perform_update(self, serializer):
        publication = serializer.save()
        if publication.doi and not publication.title:
            metadata = fetch_doi_metadata(publication.doi)
            if metadata:
                publication.title = metadata.get('title', '')
                publication.authors = metadata.get('authors', '')
                publication.journal = metadata.get('journal', '')
                publication.year = metadata.get('year')
                publication.volume = metadata.get('volume', '')
                publication.issue = metadata.get('issue', '')
                publication.pages = metadata.get('pages', '')
                if metadata.get('citation') and not publication.citation:
                    publication.citation = metadata.get('citation', '')
                publication.save()


class AwardViewSet(viewsets.ModelViewSet):
    serializer_class = AwardSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Award.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class PersonalStatementViewSet(viewsets.ModelViewSet):
    serializer_class = PersonalStatementSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return PersonalStatement.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class BiosketchViewSet(viewsets.ModelViewSet):
    serializer_class = BiosketchSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Biosketch.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


def escape_latex(text):
    """Escape special LaTeX characters - only escape what's necessary in text mode"""
    if text is None:
        return ""
    if not text:
        return ""
    import re
    result = str(text)
    
    # First, clean up any errant LaTeX escaping that might already be in the text
    # Remove backslashes before apostrophes and common punctuation (these don't need escaping in text mode)
    result = re.sub(r"\\(['`])", r'\1', result)  # Remove \' and \`
    
    # Handle curly/smart quotes - convert to straight quotes (apostrophes are fine in LaTeX)
    result = result.replace(''', "'")
    result = result.replace(''', "'")
    result = result.replace('"', '"')
    result = result.replace('"', '"')
    
    # IMPORTANT: Escape % first to prevent comment issues
    # This must be done before any other processing to avoid comment-related errors
    # Replace all % with \%, but avoid double-escaping
    # First, temporarily mark already-escaped % characters
    result = result.replace(r'\%', '___ESCAPED_PERCENT___')
    # Now escape all remaining % characters
    result = result.replace('%', r'\%')
    # Restore the already-escaped ones
    result = result.replace('___ESCAPED_PERCENT___', r'\%')
    
    # Escape special LaTeX characters that need escaping in text mode
    # Note: apostrophes (') don't need escaping in text mode
    replacements = [
        ('&', r'\&'),
        ('$', r'\$'),
        ('#', r'\#'),
        ('^', r'\^{}'),
        ('_', r'\_'),
        ('{', r'\{'),
        ('}', r'\}'),
        ('~', r'\textasciitilde{}'),
    ]
    
    for char, replacement in replacements:
        result = result.replace(char, replacement)
    
    # Escape backslashes last - but only standalone backslashes not part of LaTeX commands
    # This regex matches a backslash not followed by a letter, {, or one of our escape sequences
    # Updated to properly handle already-escaped sequences
    result = re.sub(r'\\(?![a-zA-Z{}\\&%$#^_~])', r'\\textbackslash{}', result)
    
    return result


def get_template_env():
    """Get Jinja2 template environment"""
    template_dir = Path(__file__).parent / 'templates'
    env = Environment(
        loader=FileSystemLoader(str(template_dir)),
        autoescape=select_autoescape(['html', 'xml']),
        trim_blocks=True,
        lstrip_blocks=True
    )
    # Add LaTeX escape filter
    env.filters['latex'] = escape_latex
    return env


def prepare_template_data(related_publications, other_publications, educations, experiences, summary, first_name, middle_initial, last_name, title):
    """Prepare data structure for template rendering"""
    # Prepare education data
    edu_data = []
    for edu in educations:
        grad_year_str = str(edu.grad_year) if edu.grad_year is not None else ''
        edu_data.append({
            'school_name': escape_latex(edu.school_name),
            'location': escape_latex(edu.location),
            'field_of_study': escape_latex(edu.field_of_study),
            'degree_type': escape_latex(edu.degree_type),
            'grad_year': escape_latex(grad_year_str),
        })

    # Prepare experience data
    exp_data = []
    for exp in experiences:
        start_year_str = str(exp.start_year) if exp.start_year is not None else ''
        if exp.end_year:
            years = f"{start_year_str} - {exp.end_year}"
        else:
            years = f"{start_year_str} - present"
        exp_data.append({
            'title': escape_latex(exp.title),
            'institution': escape_latex(exp.institution),
            'years': escape_latex(years),
        })

    # Prepare publication data
    related_pub_data = []
    for pub in related_publications:
        if pub.citation:
            citation = pub.citation
        elif pub.doi:
            citation = f"DOI: {pub.doi}"
        else:
            citation = ""
        related_pub_data.append({
            'citation': escape_latex(citation),
        })

    other_pub_data = []
    for pub in other_publications:
        if pub.citation:
            citation = pub.citation
        elif pub.doi:
            citation = f"DOI: {pub.doi}"
        else:
            citation = ""
        other_pub_data.append({
            'citation': escape_latex(citation),
        })

    return {
        'summary': escape_latex(summary),
        'educations': edu_data,
        'experiences': exp_data,
        'related_publications': related_pub_data,
        'other_publications': other_pub_data,
        'first_name': escape_latex(first_name),
        'middle_initial': escape_latex(middle_initial) if middle_initial else '',
        'last_name': escape_latex(last_name),
        'title': escape_latex(title) if title else '',
    }


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_biosketch(request):
    serializer = BiosketchRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    related_ids = serializer.validated_data['related_publication_ids']
    other_ids = serializer.validated_data['other_publication_ids']
    export_format = request.data.get('format', 'pdf').lower()  # pdf, latex, html
    
    # Get summary from personal statement if ID provided, otherwise use summary field
    personal_statement_id = serializer.validated_data.get('personal_statement_id')
    if personal_statement_id:
        try:
            personal_statement = PersonalStatement.objects.get(
                id=personal_statement_id,
                user=request.user
            )
            summary = personal_statement.content
        except PersonalStatement.DoesNotExist:
            return Response(
                {"error": "Personal statement not found or does not belong to you"},
                status=status.HTTP_400_BAD_REQUEST
            )
    else:
        summary = serializer.validated_data.get('summary', '')

    related_queryset = Publication.objects.filter(
        id__in=related_ids,
        user=request.user
    )
    if related_queryset.count() != 5:
        return Response(
            {"error": "Must provide exactly 5 valid related publication IDs that belong to you"},
            status=status.HTTP_400_BAD_REQUEST
        )

    other_queryset = Publication.objects.filter(
        id__in=other_ids,
        user=request.user
    )
    if other_queryset.count() != 5:
        return Response(
            {"error": "Must provide exactly 5 valid other publication IDs that belong to you"},
            status=status.HTTP_400_BAD_REQUEST
        )

    related_dict = {pub.id: pub for pub in related_queryset}
    related_publications = [related_dict[pub_id] for pub_id in related_ids]

    other_dict = {pub.id: pub for pub in other_queryset}
    other_publications = [other_dict[pub_id] for pub_id in other_ids]

    educations = Education.objects.filter(user=request.user).order_by('-grad_year')
    experiences = ProfessionalExperience.objects.filter(user=request.user).order_by('-start_year')

    # Get name and title fields
    first_name = serializer.validated_data.get('first_name', '')
    middle_initial = serializer.validated_data.get('middle_initial', '')
    last_name = serializer.validated_data.get('last_name', '')
    title = serializer.validated_data.get('title', '')

    try:
        if export_format == 'latex':
            latex_content = generate_biosketch_latex(
                related_publications=list(related_publications),
                other_publications=list(other_publications),
                educations=list(educations),
                experiences=list(experiences),
                summary=summary,
                first_name=first_name,
                middle_initial=middle_initial,
                last_name=last_name,
                title=title,
            )
            response = HttpResponse(latex_content, content_type='text/plain; charset=utf-8')
            response['Content-Disposition'] = 'attachment; filename="biosketch.tex"'
            return response
        
        elif export_format == 'html':
            html_content = generate_biosketch_html(
                related_publications=list(related_publications),
                other_publications=list(other_publications),
                educations=list(educations),
                experiences=list(experiences),
                summary=summary,
                first_name=first_name,
                middle_initial=middle_initial,
                last_name=last_name,
                title=title,
            )
            response = HttpResponse(html_content, content_type='text/html; charset=utf-8')
            response['Content-Disposition'] = 'attachment; filename="biosketch.html"'
            return response
        
        else:  # pdf (default)
            pdf_content = generate_biosketch_pdf(
                related_publications=list(related_publications),
                other_publications=list(other_publications),
                educations=list(educations),
                experiences=list(experiences),
                summary=summary,
                first_name=first_name,
                middle_initial=middle_initial,
                last_name=last_name,
                title=title,
            )
            response = HttpResponse(pdf_content, content_type='application/pdf')
            response['Content-Disposition'] = 'inline; filename="nih_biosketch.pdf"'
            response['Content-Length'] = len(pdf_content)
            return response

    except subprocess.CalledProcessError as e:
        return Response(
            {"error": f"PDF generation failed: {str(e)}. Make sure pdflatex is installed."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    except FileNotFoundError:
        return Response(
            {"error": "pdflatex not found. Please install a LaTeX distribution (e.g., TeX Live or MiKTeX)."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    except Exception as e:
        error_details = str(e)
        return Response(
            {
                "error": f"Error generating biosketch: {error_details}",
                "hint": "Check that pdflatex is installed and the LaTeX template is valid."
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


def generate_biosketch_latex(related_publications, other_publications, educations, experiences, summary, first_name, middle_initial, last_name, title):
    """Generate raw LaTeX content from template"""
    env = get_template_env()
    template = env.get_template('nih_biosketch.tex')
    data = prepare_template_data(related_publications, other_publications, educations, experiences, summary, first_name, middle_initial, last_name, title)
    return template.render(**data)


def generate_biosketch_html(related_publications, other_publications, educations, experiences, summary, first_name, middle_initial, last_name, title):
    """Generate HTML content by converting LaTeX to HTML using pandoc"""
    # First generate the LaTeX content
    latex_content = generate_biosketch_latex(
        related_publications, other_publications, educations, experiences, summary, first_name, middle_initial, last_name, title
    )

    # Convert LaTeX to HTML using pandoc
    with tempfile.TemporaryDirectory() as temp_dir:
        tex_file = Path(temp_dir) / 'biosketch.tex'
        html_file = Path(temp_dir) / 'biosketch.html'

        # Write LaTeX content
        with open(tex_file, 'w', encoding='utf-8') as f:
            f.write(latex_content)

        # Convert using pandoc
        try:
            result = subprocess.run(
                ['pandoc', str(tex_file), '-f', 'latex', '-t', 'html', '-o', str(html_file)],
                check=True,
                capture_output=True,
                text=True
            )
        except FileNotFoundError:
            raise Exception(
                "pandoc not found. Please install pandoc to export HTML. "
                "Visit https://pandoc.org/installing.html for installation instructions."
            )
        except subprocess.CalledProcessError as e:
            raise Exception(f"HTML conversion failed: {e.stderr}")

        if not html_file.exists():
            raise Exception("HTML file was not generated")

        # Read and return HTML content
        with open(html_file, 'r', encoding='utf-8') as f:
            html_content = f.read()

        return html_content


def generate_biosketch_pdf(related_publications, other_publications, educations, experiences, summary, first_name, middle_initial, last_name, title):
    """Generate PDF from LaTeX template"""
    latex_content = generate_biosketch_latex(
        related_publications, other_publications, educations, experiences, summary, first_name, middle_initial, last_name, title
    )

    with tempfile.TemporaryDirectory() as temp_dir:
        tex_file = Path(temp_dir) / 'biosketch.tex'
        pdf_file = Path(temp_dir) / 'biosketch.pdf'

        with open(tex_file, 'w', encoding='utf-8') as f:
            f.write(latex_content)

        result1 = subprocess.run(
            ['pdflatex', '-interaction=nonstopmode', '-output-directory', temp_dir, str(tex_file)],
            check=False,
            capture_output=True,
            text=True
        )
        result2 = subprocess.run(
            ['pdflatex', '-interaction=nonstopmode', '-output-directory', temp_dir, str(tex_file)],
            check=False,
            capture_output=True,
            text=True
        )

        if not pdf_file.exists():
            error_output = result1.stdout + result1.stderr if result1.stdout or result1.stderr else "No output"
            if result2.stdout or result2.stderr:
                error_output += "\n\nSecond run:\n" + result2.stdout + result2.stderr
            raise Exception(f"PDF generation failed: {error_output}")

        with open(pdf_file, 'rb') as f:
            pdf_content = f.read()

        if len(pdf_content) == 0:
            raise Exception("Generated PDF is empty")

        return pdf_content
