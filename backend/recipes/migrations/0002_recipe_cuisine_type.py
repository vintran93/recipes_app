# Generated by Django 5.2.4 on 2025-07-23 23:43

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('recipes', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='recipe',
            name='cuisine_type',
            field=models.CharField(blank=True, help_text='e.g., Italian, Mexican, Indian', max_length=100, null=True),
        ),
    ]
