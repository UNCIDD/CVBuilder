from django.db import models
from django.contrib.auth.models import User


class Education(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='educations')
    school_name = models.CharField(max_length=200)
    location = models.CharField(max_length=200)
    grad_year = models.IntegerField()
    degree_type = models.CharField(max_length=50)
    field_of_study = models.CharField(max_length=200)

    def __str__(self):
        return f"{self.degree_type} in {self.field_of_study}, {self.school_name}"

    class Meta:
        ordering = ['-grad_year']


class ProfessionalExperience(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='professional_experiences')
    title = models.CharField(max_length=200)
    institution = models.CharField(max_length=200)
    start_year = models.IntegerField()
    end_year = models.IntegerField(null=True, blank=True)

    def __str__(self):
        if self.end_year:
            return f"{self.title} at {self.institution} ({self.start_year}-{self.end_year})"
        return f"{self.title} at {self.institution} ({self.start_year}-present)"

    class Meta:
        ordering = ['-start_year']


class Publication(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='publications')
    doi = models.CharField(max_length=200)
    citation = models.TextField(blank=True)

    def __str__(self):
        return self.doi

    class Meta:
        ordering = ['-id']


class Award(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='awards')
    name = models.CharField(max_length=200)
    year = models.IntegerField()

    def __str__(self):
        return f"{self.name} ({self.year})"

    class Meta:
        ordering = ['-year']
