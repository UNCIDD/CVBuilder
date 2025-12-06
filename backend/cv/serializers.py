from rest_framework import serializers
from .models import Education, ProfessionalExperience, Publication, Award, PersonalStatement, Biosketch


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


class PersonalStatementSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = PersonalStatement
        fields = '__all__'


class BiosketchSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Biosketch
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class BiosketchRequestSerializer(serializers.Serializer):
    related_publication_ids = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=5,
        max_length=5,
        help_text="List of exactly 5 publication IDs for 'Five most closely related to research'"
    )
    other_publication_ids = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=5,
        max_length=5,
        help_text="List of exactly 5 publication IDs for 'Five other significant publications'"
    )
    personal_statement_id = serializers.IntegerField(
        required=False,
        allow_null=True,
        help_text="ID of a saved personal statement to use"
    )
    summary = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text="Personal summary/biographical statement (used if personal_statement_id not provided)"
    )

    def validate(self, data):
        if not data.get('personal_statement_id') and not data.get('summary'):
            raise serializers.ValidationError(
                "Either personal_statement_id or summary must be provided"
            )
        return data

