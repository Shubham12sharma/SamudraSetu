from django.core.management.base import BaseCommand
from beaches.models import Beach
import json

class Command(BaseCommand):
    help = 'Import beaches from JSON file'

    def add_arguments(self, parser):
        parser.add_argument('--file', type=str, default='beaches.json')

    def handle(self, *args, **options):
        with open(options['file']) as f:
            data = json.load(f)
        
        for beach_data in data['beaches']:
            Beach.objects.get_or_create(
                name=beach_data['name'],
                defaults={
                    'state': beach_data['state'],
                    'latitude': beach_data['latitude'],
                    'longitude': beach_data['longitude'],
                    'description': beach_data.get('description', ''),
                }
            )
        self.stdout.write(self.style.SUCCESS('Successfully imported beaches'))
