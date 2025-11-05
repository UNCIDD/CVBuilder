# Generated manually for adding user ForeignKey to models

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def set_default_user(apps, schema_editor):
    """
    Set a default user for existing records.
    If no users exist, this will fail - you'll need to create a user first.
    """
    User = apps.get_model('auth', 'User')
    Education = apps.get_model('cv', 'Education')
    ProfessionalExperience = apps.get_model('cv', 'ProfessionalExperience')
    Publication = apps.get_model('cv', 'Publication')
    Award = apps.get_model('cv', 'Award')

    default_user = User.objects.first()
    if not default_user:
        default_user = User.objects.create_user(
            username='default_user',
            email='default@example.com',
            password='changeme'
        )

    Education.objects.all().update(user=default_user)
    ProfessionalExperience.objects.all().update(user=default_user)
    Publication.objects.all().update(user=default_user)
    Award.objects.all().update(user=default_user)


def reverse_set_default_user(apps, schema_editor):
    """Reverse migration - nothing to do"""
    pass


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('cv', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='education',
            name='user',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='educations',
                to=settings.AUTH_USER_MODEL,
                null=True  # Temporary null to allow adding the field
            ),
        ),
        migrations.AddField(
            model_name='professionalexperience',
            name='user',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='professional_experiences',
                to=settings.AUTH_USER_MODEL,
                null=True  # Temporary null to allow adding the field
            ),
        ),
        migrations.AddField(
            model_name='publication',
            name='user',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='publications',
                to=settings.AUTH_USER_MODEL,
                null=True  # Temporary null to allow adding the field
            ),
        ),
        migrations.AddField(
            model_name='award',
            name='user',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='awards',
                to=settings.AUTH_USER_MODEL,
                null=True  # Temporary null to allow adding the field
            ),
        ),
        migrations.RunPython(set_default_user, reverse_set_default_user),
        migrations.AlterField(
            model_name='education',
            name='user',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='educations',
                to=settings.AUTH_USER_MODEL
            ),
        ),
        migrations.AlterField(
            model_name='professionalexperience',
            name='user',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='professional_experiences',
                to=settings.AUTH_USER_MODEL
            ),
        ),
        migrations.AlterField(
            model_name='publication',
            name='user',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='publications',
                to=settings.AUTH_USER_MODEL
            ),
        ),
        migrations.AlterField(
            model_name='award',
            name='user',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='awards',
                to=settings.AUTH_USER_MODEL
            ),
        ),
    ]

