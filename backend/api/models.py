from django.db import models
from django.contrib.postgres.fields import ArrayField

# Create your models here.

class Document(models.Model):
    """
    Model representing an uploaded document
    """
    title = models.CharField(max_length=255)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class DocumentChunk(models.Model):
    """
    Model representing a chunk of text from a document with its embedding
    """
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='chunks')
    content = models.TextField()
    embedding = ArrayField(models.FloatField(), size=1536)  # OpenAI embedding size
    relevance = models.FloatField(null=True)  # Used to store similarity scores during retrieval

    def __str__(self):
        return f"Chunk of {self.document.title}"

class Message(models.Model):
    """
    Model representing chat messages between user and AI
    """
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='messages')
    content = models.TextField()
    is_user = models.BooleanField()  # True for user messages, False for AI responses
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"{'User' if self.is_user else 'Assistant'} message for {self.document.title}"
