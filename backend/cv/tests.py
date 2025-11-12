from django.test import TestCase
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework.authtoken.models import Token
from .models import Education, ProfessionalExperience, Publication, Award


class EducationModelTest(TestCase):
    """Test cases for Education model"""

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

    def test_education_creation(self):
        """Test creating an Education instance"""
        education = Education.objects.create(
            user=self.user,
            school_name='Test University',
            location='Test City',
            grad_year=2020,
            degree_type='PhD',
            field_of_study='Computer Science'
        )
        self.assertEqual(education.school_name, 'Test University')
        self.assertEqual(education.user, self.user)
        self.assertEqual(str(education), 'PhD in Computer Science, Test University')

    def test_education_ordering(self):
        """Test that educations are ordered by grad_year descending"""
        Education.objects.create(
            user=self.user,
            school_name='University A',
            location='City A',
            grad_year=2015,
            degree_type='BS',
            field_of_study='Math'
        )
        Education.objects.create(
            user=self.user,
            school_name='University B',
            location='City B',
            grad_year=2020,
            degree_type='MS',
            field_of_study='Physics'
        )
        educations = Education.objects.all()
        self.assertEqual(educations[0].grad_year, 2020)
        self.assertEqual(educations[1].grad_year, 2015)

    def test_education_user_relationship(self):
        """Test that education is linked to user via foreign key"""
        education = Education.objects.create(
            user=self.user,
            school_name='Test University',
            location='Test City',
            grad_year=2020,
            degree_type='PhD',
            field_of_study='Computer Science'
        )
        self.assertEqual(education.user, self.user)
        self.assertIn(education, self.user.educations.all())


class ProfessionalExperienceModelTest(TestCase):
    """Test cases for ProfessionalExperience model"""

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

    def test_professional_experience_creation(self):
        """Test creating a ProfessionalExperience instance"""
        exp = ProfessionalExperience.objects.create(
            user=self.user,
            title='Software Engineer',
            institution='Tech Corp',
            start_year=2020,
            end_year=2022
        )
        self.assertEqual(exp.title, 'Software Engineer')
        self.assertEqual(exp.user, self.user)
        self.assertEqual(str(exp), 'Software Engineer at Tech Corp (2020-2022)')

    def test_professional_experience_without_end_year(self):
        """Test ProfessionalExperience without end_year (current position)"""
        exp = ProfessionalExperience.objects.create(
            user=self.user,
            title='Senior Engineer',
            institution='Tech Corp',
            start_year=2022
        )
        self.assertIsNone(exp.end_year)
        self.assertEqual(str(exp), 'Senior Engineer at Tech Corp (2022-present)')

    def test_professional_experience_ordering(self):
        """Test that experiences are ordered by start_year descending"""
        ProfessionalExperience.objects.create(
            user=self.user,
            title='Engineer',
            institution='Company A',
            start_year=2018,
            end_year=2020
        )
        ProfessionalExperience.objects.create(
            user=self.user,
            title='Senior Engineer',
            institution='Company B',
            start_year=2020,
            end_year=2022
        )
        experiences = ProfessionalExperience.objects.all()
        self.assertEqual(experiences[0].start_year, 2020)
        self.assertEqual(experiences[1].start_year, 2018)

    def test_professional_experience_user_relationship(self):
        """Test that experience is linked to user via foreign key"""
        exp = ProfessionalExperience.objects.create(
            user=self.user,
            title='Engineer',
            institution='Tech Corp',
            start_year=2020
        )
        self.assertEqual(exp.user, self.user)
        self.assertIn(exp, self.user.professional_experiences.all())


class PublicationModelTest(TestCase):
    """Test cases for Publication model"""

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

    def test_publication_creation(self):
        """Test creating a Publication instance"""
        pub = Publication.objects.create(
            user=self.user,
            doi='10.1234/test.doi',
            citation='Test Citation'
        )
        self.assertEqual(pub.doi, '10.1234/test.doi')
        self.assertEqual(pub.user, self.user)
        self.assertEqual(str(pub), '10.1234/test.doi')

    def test_publication_without_citation(self):
        """Test Publication with blank citation"""
        pub = Publication.objects.create(
            user=self.user,
            doi='10.1234/test.doi'
        )
        self.assertEqual(pub.citation, '')
        self.assertTrue(pub.citation == '')

    def test_publication_ordering(self):
        """Test that publications are ordered by id descending"""
        pub1 = Publication.objects.create(
            user=self.user,
            doi='10.1234/first.doi'
        )
        pub2 = Publication.objects.create(
            user=self.user,
            doi='10.1234/second.doi'
        )
        publications = Publication.objects.all()
        # Newer publications (higher id) should come first
        self.assertGreaterEqual(publications[0].id, publications[1].id)

    def test_publication_user_relationship(self):
        """Test that publication is linked to user via foreign key"""
        pub = Publication.objects.create(
            user=self.user,
            doi='10.1234/test.doi'
        )
        self.assertEqual(pub.user, self.user)
        self.assertIn(pub, self.user.publications.all())


class AwardModelTest(TestCase):
    """Test cases for Award model"""

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

    def test_award_creation(self):
        """Test creating an Award instance"""
        award = Award.objects.create(
            user=self.user,
            name='Best Paper Award',
            year=2020
        )
        self.assertEqual(award.name, 'Best Paper Award')
        self.assertEqual(award.user, self.user)
        self.assertEqual(str(award), 'Best Paper Award (2020)')

    def test_award_ordering(self):
        """Test that awards are ordered by year descending"""
        Award.objects.create(
            user=self.user,
            name='Award A',
            year=2018
        )
        Award.objects.create(
            user=self.user,
            name='Award B',
            year=2020
        )
        awards = Award.objects.all()
        self.assertEqual(awards[0].year, 2020)
        self.assertEqual(awards[1].year, 2018)

    def test_award_user_relationship(self):
        """Test that award is linked to user via foreign key"""
        award = Award.objects.create(
            user=self.user,
            name='Test Award',
            year=2020
        )
        self.assertEqual(award.user, self.user)
        self.assertIn(award, self.user.awards.all())


class EducationViewSetTest(TestCase):
    """Test cases for EducationViewSet API"""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.other_user = User.objects.create_user(
            username='otheruser',
            email='other@example.com',
            password='testpass123'
        )
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.token.key)

    def test_list_educations_authenticated(self):
        """Test listing educations when authenticated"""
        Education.objects.create(
            user=self.user,
            school_name='Test University',
            location='Test City',
            grad_year=2020,
            degree_type='PhD',
            field_of_study='Computer Science'
        )
        url = reverse('education-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_list_educations_unauthenticated(self):
        """Test that unauthenticated users cannot list educations"""
        self.client.credentials()
        url = reverse('education-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_education(self):
        """Test creating an education"""
        url = reverse('education-list')
        data = {
            'school_name': 'New University',
            'location': 'New City',
            'grad_year': 2021,
            'degree_type': 'MS',
            'field_of_study': 'Data Science'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Education.objects.count(), 1)
        education = Education.objects.first()
        self.assertEqual(education.user, self.user)
        self.assertEqual(education.school_name, 'New University')

    def test_user_can_only_see_own_educations(self):
        """Test that users can only see their own educations"""
        Education.objects.create(
            user=self.user,
            school_name='My University',
            location='My City',
            grad_year=2020,
            degree_type='PhD',
            field_of_study='CS'
        )
        Education.objects.create(
            user=self.other_user,
            school_name='Other University',
            location='Other City',
            grad_year=2019,
            degree_type='BS',
            field_of_study='Math'
        )
        url = reverse('education-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['school_name'], 'My University')

    def test_retrieve_education(self):
        """Test retrieving a specific education"""
        education = Education.objects.create(
            user=self.user,
            school_name='Test University',
            location='Test City',
            grad_year=2020,
            degree_type='PhD',
            field_of_study='Computer Science'
        )
        url = reverse('education-detail', kwargs={'pk': education.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['school_name'], 'Test University')

    def test_update_education(self):
        """Test updating an education"""
        education = Education.objects.create(
            user=self.user,
            school_name='Test University',
            location='Test City',
            grad_year=2020,
            degree_type='PhD',
            field_of_study='Computer Science'
        )
        url = reverse('education-detail', kwargs={'pk': education.pk})
        data = {'school_name': 'Updated University', 'location': 'Test City',
                'grad_year': 2020, 'degree_type': 'PhD', 'field_of_study': 'Computer Science'}
        response = self.client.put(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        education.refresh_from_db()
        self.assertEqual(education.school_name, 'Updated University')

    def test_delete_education(self):
        """Test deleting an education"""
        education = Education.objects.create(
            user=self.user,
            school_name='Test University',
            location='Test City',
            grad_year=2020,
            degree_type='PhD',
            field_of_study='Computer Science'
        )
        url = reverse('education-detail', kwargs={'pk': education.pk})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Education.objects.count(), 0)


class ProfessionalExperienceViewSetTest(TestCase):
    """Test cases for ProfessionalExperienceViewSet API"""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.other_user = User.objects.create_user(
            username='otheruser',
            email='other@example.com',
            password='testpass123'
        )
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.token.key)

    def test_list_experiences_authenticated(self):
        """Test listing experiences when authenticated"""
        ProfessionalExperience.objects.create(
            user=self.user,
            title='Engineer',
            institution='Tech Corp',
            start_year=2020
        )
        url = reverse('professional-experience-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_list_experiences_unauthenticated(self):
        """Test that unauthenticated users cannot list experiences"""
        self.client.credentials()
        url = reverse('professional-experience-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_experience(self):
        """Test creating an experience"""
        url = reverse('professional-experience-list')
        data = {
            'title': 'Senior Engineer',
            'institution': 'Tech Corp',
            'start_year': 2020,
            'end_year': 2022
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ProfessionalExperience.objects.count(), 1)
        experience = ProfessionalExperience.objects.first()
        self.assertEqual(experience.user, self.user)

    def test_create_experience_without_end_year(self):
        """Test creating an experience without end_year (current position)"""
        url = reverse('professional-experience-list')
        data = {
            'title': 'Senior Engineer',
            'institution': 'Tech Corp',
            'start_year': 2020
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        experience = ProfessionalExperience.objects.first()
        self.assertIsNone(experience.end_year)

    def test_user_can_only_see_own_experiences(self):
        """Test that users can only see their own experiences"""
        ProfessionalExperience.objects.create(
            user=self.user,
            title='My Job',
            institution='My Corp',
            start_year=2020
        )
        ProfessionalExperience.objects.create(
            user=self.other_user,
            title='Other Job',
            institution='Other Corp',
            start_year=2019
        )
        url = reverse('professional-experience-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], 'My Job')

    def test_update_experience(self):
        """Test updating an experience"""
        experience = ProfessionalExperience.objects.create(
            user=self.user,
            title='Engineer',
            institution='Tech Corp',
            start_year=2020
        )
        url = reverse('professional-experience-detail', kwargs={'pk': experience.pk})
        data = {'title': 'Senior Engineer', 'institution': 'Tech Corp', 'start_year': 2020}
        response = self.client.put(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        experience.refresh_from_db()
        self.assertEqual(experience.title, 'Senior Engineer')

    def test_delete_experience(self):
        """Test deleting an experience"""
        experience = ProfessionalExperience.objects.create(
            user=self.user,
            title='Engineer',
            institution='Tech Corp',
            start_year=2020
        )
        url = reverse('professional-experience-detail', kwargs={'pk': experience.pk})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(ProfessionalExperience.objects.count(), 0)


class PublicationViewSetTest(TestCase):
    """Test cases for PublicationViewSet API"""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.other_user = User.objects.create_user(
            username='otheruser',
            email='other@example.com',
            password='testpass123'
        )
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.token.key)

    def test_list_publications_authenticated(self):
        """Test listing publications when authenticated"""
        Publication.objects.create(
            user=self.user,
            doi='10.1234/test.doi',
            citation='Test Citation'
        )
        url = reverse('publication-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_list_publications_unauthenticated(self):
        """Test that unauthenticated users cannot list publications"""
        self.client.credentials()
        url = reverse('publication-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_publication(self):
        """Test creating a publication"""
        url = reverse('publication-list')
        data = {
            'doi': '10.1234/new.doi',
            'citation': 'New Citation'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Publication.objects.count(), 1)
        publication = Publication.objects.first()
        self.assertEqual(publication.user, self.user)

    def test_user_can_only_see_own_publications(self):
        """Test that users can only see their own publications"""
        Publication.objects.create(
            user=self.user,
            doi='10.1234/my.doi'
        )
        Publication.objects.create(
            user=self.other_user,
            doi='10.1234/other.doi'
        )
        url = reverse('publication-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['doi'], '10.1234/my.doi')

    def test_update_publication(self):
        """Test updating a publication"""
        publication = Publication.objects.create(
            user=self.user,
            doi='10.1234/test.doi',
            citation='Old Citation'
        )
        url = reverse('publication-detail', kwargs={'pk': publication.pk})
        data = {'doi': '10.1234/test.doi', 'citation': 'Updated Citation'}
        response = self.client.put(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        publication.refresh_from_db()
        self.assertEqual(publication.citation, 'Updated Citation')

    def test_delete_publication(self):
        """Test deleting a publication"""
        publication = Publication.objects.create(
            user=self.user,
            doi='10.1234/test.doi'
        )
        url = reverse('publication-detail', kwargs={'pk': publication.pk})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Publication.objects.count(), 0)


class AwardViewSetTest(TestCase):
    """Test cases for AwardViewSet API"""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.other_user = User.objects.create_user(
            username='otheruser',
            email='other@example.com',
            password='testpass123'
        )
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.token.key)

    def test_list_awards_authenticated(self):
        """Test listing awards when authenticated"""
        Award.objects.create(
            user=self.user,
            name='Test Award',
            year=2020
        )
        url = reverse('award-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_list_awards_unauthenticated(self):
        """Test that unauthenticated users cannot list awards"""
        self.client.credentials()
        url = reverse('award-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_award(self):
        """Test creating an award"""
        url = reverse('award-list')
        data = {
            'name': 'Best Paper Award',
            'year': 2020
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Award.objects.count(), 1)
        award = Award.objects.first()
        self.assertEqual(award.user, self.user)

    def test_user_can_only_see_own_awards(self):
        """Test that users can only see their own awards"""
        Award.objects.create(
            user=self.user,
            name='My Award',
            year=2020
        )
        Award.objects.create(
            user=self.other_user,
            name='Other Award',
            year=2019
        )
        url = reverse('award-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'My Award')

    def test_update_award(self):
        """Test updating an award"""
        award = Award.objects.create(
            user=self.user,
            name='Old Award',
            year=2020
        )
        url = reverse('award-detail', kwargs={'pk': award.pk})
        data = {'name': 'Updated Award', 'year': 2020}
        response = self.client.put(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        award.refresh_from_db()
        self.assertEqual(award.name, 'Updated Award')

    def test_delete_award(self):
        """Test deleting an award"""
        award = Award.objects.create(
            user=self.user,
            name='Test Award',
            year=2020
        )
        url = reverse('award-detail', kwargs={'pk': award.pk})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Award.objects.count(), 0)
