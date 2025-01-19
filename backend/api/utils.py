import os
from typing import List, Optional
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document as LangChainDocument
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from io import BytesIO
import PyPDF2
from pgvector.django import CosineDistance, VectorField
from pgvector.sqlalchemy import Vector
from .models import Document, DocumentChunk
from django.contrib.postgres.expressions import ArrayField
from django.db.models.functions import Cast
from django.db.models import FloatField
from django.db.models import F
from django.db.models.expressions import RawSQL

# Initialize OpenAI components
embeddings = OpenAIEmbeddings(
    model="text-embedding-ada-002",
)

llm = ChatOpenAI(
    model="gpt-3.5-turbo",
    temperature=0.7,
)

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
    length_function=len,
)

def extract_text_from_pdf(content: bytes) -> str:
    """Extract text from PDF content."""
    pdf_file = BytesIO(content)
    pdf_reader = PyPDF2.PdfReader(pdf_file)
    text = ""
    for page in pdf_reader.pages:
        text += page.extract_text() + "\n"
    return text

def extract_text_from_file(content: bytes, filename: str) -> str:
    """Extract text from file based on its extension."""
    if filename.lower().endswith('.pdf'):
        return extract_text_from_pdf(content)
    elif filename.lower().endswith('.txt'):
        try:
            return content.decode('utf-8')
        except UnicodeDecodeError:
            # Try different encodings if UTF-8 fails
            try:
                return content.decode('latin-1')
            except UnicodeDecodeError:
                return content.decode('cp1252')
    else:
        raise ValueError("Unsupported file type. Only PDF and TXT files are supported.")

def process_document(document_id: int, content: bytes, filename: str):
    # Extract text based on file type
    text = extract_text_from_file(content, filename)
    
    # Create LangChain document
    doc = LangChainDocument(page_content=text)
    
    # Split text into chunks using LangChain
    chunks = text_splitter.split_documents([doc])
    
    document = Document.objects.get(id=document_id)
    
    # Create document chunks with embeddings
    for chunk in chunks:
        embedding = embeddings.embed_query(chunk.page_content)
        DocumentChunk.objects.create(
            document=document,
            content=chunk.page_content,
            embedding=embedding
        )

def get_relevant_chunks(query: str, document_id: int, limit: int = 3) -> List[DocumentChunk]:
    """Get relevant document chunks for a query using vector similarity."""
    # Get query embedding
    query_embedding = embeddings.embed_query(query)
    
    # Convert embedding to string for SQL
    embedding_str = '[' + ','.join(map(str, query_embedding)) + ']'
    
    # Get chunks ordered by similarity using pgvector's <=> operator
    chunks = DocumentChunk.objects.filter(document_id=document_id)\
        .annotate(
            similarity_score=RawSQL(
                "1 - (embedding::vector <=> %s::vector)", 
                [embedding_str]
            )
        )\
        .order_by('-similarity_score')[:limit]
    
    # Add relevance scores to chunks
    for chunk in chunks:
        chunk.relevance = float(chunk.similarity_score)
    
    return chunks

def get_chat_response(message: str, chunks: Optional[List[DocumentChunk]] = None) -> str:
    """Generate a response using the chat model."""
    if not chunks:
        # If no context is provided, respond accordingly
        return "I couldn't find any relevant information in the document to answer your question. Could you please rephrase your question or ask something else about the document?"

    # Create context from chunks
    context = "\n\n".join(f"Excerpt {i+1}:\n{chunk.content}" for i, chunk in enumerate(chunks))
    
    # Create prompt template
    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are a helpful assistant that answers questions based on the provided document excerpts. 
        Use the information from the excerpts to provide accurate and relevant answers.
        If the excerpts don't contain enough information to answer the question fully, acknowledge this and answer with what you can find.
        Always maintain a professional and helpful tone."""),
        ("user", """Here are some relevant excerpts from the document:

{context}

Question: {question}""")
    ])
    
    # Create chain
    chain = prompt | llm | StrOutputParser()
    
    # Generate response
    response = chain.invoke({
        "context": context,
        "question": message
    })
    
    return response 
