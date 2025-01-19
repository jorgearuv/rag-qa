from django.db import migrations
from pgvector.django import VectorField

class Migration(migrations.Migration):
    dependencies = [
        ('api', '0004_add_vector_index'),
    ]

    operations = [
        migrations.RunSQL(
            # Drop the existing index first
            'DROP INDEX IF EXISTS document_chunks_embedding_idx;',
            reverse_sql='',
        ),
        migrations.AlterField(
            model_name='documentchunk',
            name='embedding',
            field=VectorField(dimensions=1536),
        ),
        migrations.RunSQL(
            '''
            CREATE INDEX document_chunks_embedding_idx 
            ON api_documentchunk 
            USING ivfflat (embedding vector_cosine_ops)
            WITH (lists = 100);
            ''',
            reverse_sql='DROP INDEX IF EXISTS document_chunks_embedding_idx;'
        ),
    ] 
