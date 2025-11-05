from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Education, ProfessionalExperience, Publication, Award
from .serializers import (
    EducationSerializer,
    ProfessionalExperienceSerializer,
    PublicationSerializer,
    AwardSerializer
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
