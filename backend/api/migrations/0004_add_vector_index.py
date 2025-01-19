from django.db import migrations

class Migration(migrations.Migration):
    dependencies = [
        ('api', '0003_alter_message_options_remove_document_file_and_more'),
    ]

    operations = [
        migrations.RunSQL(
            sql='''
                ALTER TABLE api_documentchunk 
                ALTER COLUMN embedding TYPE vector(1536);
                
                CREATE INDEX document_chunks_embedding_idx 
                ON api_documentchunk 
                USING ivfflat (embedding vector_cosine_ops)
                WITH (lists = 100);
            ''',
            reverse_sql='DROP INDEX IF EXISTS document_chunks_embedding_idx;'
        ),
    ] 
