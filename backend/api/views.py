from django.shortcuts import render, get_object_or_404
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from django.conf import settings
import os

from .models import Document, DocumentChunk, Message
from .serializers import (
    DocumentSerializer, 
    QuestionSerializer, 
    MessageSerializer,
    ChatRequestSerializer,
    ChatResponseSerializer,
    HealthCheckSerializer
)
from .utils import process_document, get_relevant_chunks, get_chat_response

@api_view(['GET'])
def health_check(request):
    """
    Health check endpoint to verify the API is running correctly
    """
    serializer = HealthCheckSerializer({"status": "healthy"})
    return Response(serializer.data, status=status.HTTP_200_OK)

# Create your views here.

class DocumentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing document operations
    """
    queryset = Document.objects.all().order_by('-uploaded_at')
    serializer_class = DocumentSerializer

    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        """
        Get all messages associated with a document
        """
        document = self.get_object()
        messages = Message.objects.filter(document=document).order_by('timestamp')
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        """
        Process uploaded document and create chunks with embeddings
        """
        document = serializer.save()
        file_obj = self.request.FILES.get('file')
        if not file_obj:
            raise ValueError("No file provided")
        
        if not file_obj.name.lower().endswith(('.pdf', '.txt')):
            raise ValueError("Unsupported file type. Only PDF and TXT files are supported.")
        
        content = file_obj.read()
        process_document(document.id, content, file_obj.name)
        return document

@api_view(['POST'])
def chat(request):
    """
    Process chat messages and return AI responses with relevant document chunks
    """
    # Validate request data
    request_serializer = ChatRequestSerializer(data=request.data)
    if not request_serializer.is_valid():
        return Response(request_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    message = request_serializer.validated_data['message']
    document_id = request_serializer.validated_data['document_id']
    
    document = get_object_or_404(Document, id=document_id)
    
    try:
        # Get relevant chunks
        relevant_chunks = get_relevant_chunks(message, document_id)
        
        # Get model response
        answer = get_chat_response(message, relevant_chunks)
        
        # Save messages
        Message.objects.create(
            content=message,
            is_user=True,
            document=document
        )
        Message.objects.create(
            content=answer,
            is_user=False,
            document=document
        )
        
        # Prepare and validate response
        response_data = {
            "answer": answer,
            "relevant_chunks": [
                {"text": chunk.content, "relevance": chunk.relevance}
                for chunk in relevant_chunks
            ]
        }
        response_serializer = ChatResponseSerializer(data=response_data)
        response_serializer.is_valid(raise_exception=True)
        
        return Response(response_serializer.data)
    except Exception as e:
        return Response(
            {"detail": str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
