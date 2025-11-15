import subprocess
import tempfile
import requests
from pathlib import Path
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.http import HttpResponse
from .models import Education, ProfessionalExperience, Publication, Award
from .serializers import (
    EducationSerializer,
    ProfessionalExperienceSerializer,
    PublicationSerializer,
    AwardSerializer,
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


class PublicationViewSet(viewsets.ModelViewSet):
    serializer_class = PublicationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Publication.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class AwardViewSet(viewsets.ModelViewSet):
    serializer_class = AwardSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Award.objects.filter(user=self.request.user)

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

    publication_ids = serializer.validated_data['publication_ids']
    summary = serializer.validated_data['summary']

    publications_queryset = Publication.objects.filter(
        id__in=publication_ids,
        user=request.user
    )

    if publications_queryset.count() != 5:
        return Response(
            {"error": "Must provide exactly 5 valid publication IDs that belong to you"},
            status=status.HTTP_400_BAD_REQUEST
        )

    publications_dict = {pub.id: pub for pub in publications_queryset}
    publications = [publications_dict[pub_id] for pub_id in publication_ids]
    educations = Education.objects.filter(user=request.user).order_by('-grad_year')
    experiences = ProfessionalExperience.objects.filter(user=request.user).order_by('-start_year')
    try:
        pdf_content = generate_biosketch_pdf(
            publications=list(publications),
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


def fetch_doi_citation(doi):
    try:
        url = f"https://citation.doi.org/format"
        params = {
            'doi': doi,
            'style': 'apa',
            'lang': 'en-US'
        }
        response = requests.get(url, params=params, timeout=10)
        if response.status_code == 200:
            return response.text.strip()
        else:
            return None
    except Exception:
        return None


def generate_biosketch_pdf(publications, educations, experiences, summary, user):
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

    publications_text = ""
    for i, pub in enumerate(publications, 1):
        citation = fetch_doi_citation(pub.doi)
        if not citation:
            citation = pub.citation if pub.citation else f"DOI: {pub.doi}"

        citation_escaped = escape_latex(citation)
        publications_text += f"{i}. {citation_escaped}\n\n"

    latex_content = template.replace('{{PUBLICATIONS}}', publications_text)

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
