from django.core.management.base import BaseCommand
from django.contrib.auth.models import User


class Command(BaseCommand):
    help = "Creates the demo user account for 'Play with Demo Profile' login"

    def handle(self, *args, **kwargs):
        username = "user"
        password = "User@2003"
        email = "demo@equitylens.in"

        user, created = User.objects.get_or_create(username=username)
        user.set_password(password)
        user.first_name = "Demo"
        user.last_name = "User"
        user.email = email
        user.save()

        if created:
            self.stdout.write(self.style.SUCCESS(f"✓ Demo user '{username}' created successfully."))
        else:
            self.stdout.write(self.style.SUCCESS(f"✓ Demo user '{username}' already exists — password reset."))
