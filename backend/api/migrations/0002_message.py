# Generated by Django 5.0.1 on 2025-01-19 07:15

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Message',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('content', models.TextField()),
                ('is_user', models.BooleanField(default=True)),
                ('sources', models.JSONField(blank=True, null=True)),
                ('timestamp', models.DateTimeField(auto_now_add=True)),
                ('document', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='messages', to='api.document')),
            ],
        ),
    ]
