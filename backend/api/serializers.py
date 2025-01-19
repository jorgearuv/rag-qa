from rest_framework import serializers
from .models import Document, DocumentChunk, Message

class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ['id', 'title', 'uploaded_at']

class DocumentChunkSerializer(serializers.ModelSerializer):
    class Meta:
        model = DocumentChunk
        fields = ['id', 'content', 'relevance']

class QuestionSerializer(serializers.Serializer):
    question = serializers.CharField(required=True)

class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ['id', 'content', 'is_user', 'timestamp']

class ChatRequestSerializer(serializers.Serializer):
    message = serializers.CharField(required=True)
    document_id = serializers.IntegerField(required=True)

class ChatResponseSerializer(serializers.Serializer):
    answer = serializers.CharField()
    relevant_chunks = serializers.ListField(
        child=serializers.DictField(
            child=serializers.CharField()
        )
    )

class HealthCheckSerializer(serializers.Serializer):
    status = serializers.CharField()
