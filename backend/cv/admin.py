from django.contrib import admin
from .models import Education, ProfessionalExperience, Publication, Award


@admin.register(Education)
class EducationAdmin(admin.ModelAdmin):
    list_display = ('user', 'school_name', 'degree_type', 'field_of_study', 'grad_year')
    list_filter = ('user', 'grad_year', 'degree_type')
    search_fields = ('user__username', 'school_name', 'field_of_study')
    raw_id_fields = ('user',)


@admin.register(ProfessionalExperience)
class ProfessionalExperienceAdmin(admin.ModelAdmin):
    list_display = ('user', 'title', 'institution', 'start_year', 'end_year')
    list_filter = ('user', 'start_year', 'end_year')
    search_fields = ('user__username', 'title', 'institution')
    raw_id_fields = ('user',)


@admin.register(Publication)
class PublicationAdmin(admin.ModelAdmin):
    list_display = ('user', 'doi', 'citation')
    list_filter = ('user',)
    search_fields = ('user__username', 'doi', 'citation')
    raw_id_fields = ('user',)


@admin.register(Award)
class AwardAdmin(admin.ModelAdmin):
    list_display = ('user', 'name', 'year')
    list_filter = ('user', 'year',)
    search_fields = ('user__username', 'name',)
    raw_id_fields = ('user',)
