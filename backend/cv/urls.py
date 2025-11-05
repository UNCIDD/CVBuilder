from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    EducationViewSet,
    ProfessionalExperienceViewSet,
    PublicationViewSet,
    AwardViewSet
)

router = DefaultRouter()
router.register(r'education', EducationViewSet, basename='education')
router.register(r'professional-experience', ProfessionalExperienceViewSet, basename='professional-experience')
router.register(r'publications', PublicationViewSet, basename='publication')
router.register(r'awards', AwardViewSet, basename='award')

urlpatterns = [
    path('', include(router.urls)),
]

