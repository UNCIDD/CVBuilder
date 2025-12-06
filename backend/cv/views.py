import subprocess
import tempfile
import requests
from pathlib import Path
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
    """Escape special LaTeX characters"""
    if not text:
        return ""
    replacements = {
        '&': r'\&',
        '%': r'\%',
        '$': r'\$',
        '#': r'\#',
        '^': r'\^{}',
        '_': r'\_',
        '{': r'\{',
        '}': r'\}',
        '~': r'\textasciitilde{}',
        '\\': r'\textbackslash{}',
    }
    result = str(text)
    for char, replacement in replacements.items():
        result = result.replace(char, replacement)
    return result


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_biosketch(request):
    serializer = BiosketchRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    related_ids = serializer.validated_data['related_publication_ids']
    other_ids = serializer.validated_data['other_publication_ids']
    
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

    try:
        pdf_content = generate_biosketch_pdf(
            related_publications=list(related_publications),
            other_publications=list(other_publications),
            educations=list(educations),
            experiences=list(experiences),
            summary=summary,
            user=request.user
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
                "error": f"Error generating PDF: {error_details}",
                "hint": "Check that pdflatex is installed and the LaTeX template is valid."
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


def generate_biosketch_pdf(related_publications, other_publications, educations, experiences, summary, user):
    template_path = Path(__file__).parent / 'templates' / 'nih_biosketch.tex'
    with open(template_path, 'r', encoding='utf-8') as f:
        template = f.read()

    summary_escaped = escape_latex(summary)
    template = template.replace('{{SUMMARY}}', summary_escaped)

    education_text = ""
    for edu in educations:
        school = escape_latex(edu.school_name)
        location = escape_latex(edu.location)
        field = escape_latex(edu.field_of_study)
        degree = escape_latex(edu.degree_type)
        year = str(edu.grad_year)
        education_text += f"{school} \\quad {location} \\quad {field} \\quad {degree} \\quad {year}\n\n"
    template = template.replace('{{EDUCATION}}', education_text)

    appointments_text = ""
    for exp in experiences:
        title = escape_latex(exp.title)
        institution = escape_latex(exp.institution)
        if exp.end_year:
            years = f"{exp.start_year} - {exp.end_year}"
        else:
            years = f"{exp.start_year} - present"
        appointments_text += f"{title} \\quad {institution} \\quad {years}\n\n"
    template = template.replace('{{APPOINTMENTS}}', appointments_text)

    related_publications_text = ""
    for i, pub in enumerate(related_publications, 1):
        citation = pub.citation if pub.citation else f"DOI: {pub.doi}"
        citation_escaped = escape_latex(citation)
        related_publications_text += f"{i}. {citation_escaped}\n\n"
    template = template.replace('{{RELATED_PUBLICATIONS}}', related_publications_text)

    other_publications_text = ""
    for i, pub in enumerate(other_publications, 1):
        citation = pub.citation if pub.citation else f"DOI: {pub.doi}"
        citation_escaped = escape_latex(citation)
        other_publications_text += f"{i}. {citation_escaped}\n\n"
    latex_content = template.replace('{{OTHER_PUBLICATIONS}}', other_publications_text)

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
            error_msg = f"PDF generation failed. LaTeX output:\n{error_output}"
            raise Exception(error_msg)

        with open(pdf_file, 'rb') as f:
            pdf_content = f.read()

        if len(pdf_content) == 0:
            raise Exception("Generated PDF is empty")

        return pdf_content
