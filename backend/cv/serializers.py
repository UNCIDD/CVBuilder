from rest_framework import serializers
from .models import Education, ProfessionalExperience, Publication, Award


class EducationSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Education
        fields = '__all__'


class ProfessionalExperienceSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = ProfessionalExperience
        fields = '__all__'


class PublicationSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Publication
        fields = '__all__'


class AwardSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Award
        fields = '__all__'


class BiosketchRequestSerializer(serializers.Serializer):
    publication_ids = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=5,
        max_length=5,
        help_text="List of exactly 5 publication IDs"
    )
    summary = serializers.CharField(
        required=True,
        help_text="Personal summary/biographical statement"
    )

