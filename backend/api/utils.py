import os
from typing import List
from langchain.embeddings import OpenAIEmbeddings
from langchain.chat_models import ChatOpenAI
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document as LangChainDocument
from langchain.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate
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

# Initialize LangChain components
embeddings = OpenAIEmbeddings(
    openai_api_key=os.getenv("OPENAI_API_KEY")
)

llm = ChatOpenAI(
    openai_api_key=os.getenv("OPENAI_API_KEY"),
    model_name="gpt-3.5-turbo",
    temperature=0.7
)

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
    length_function=len,
)

def extract_text_from_pdf(content: bytes) -> str:
    pdf_file = BytesIO(content)
    try:
        reader = PyPDF2.PdfReader(pdf_file)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n\n"
        return text
    except Exception as e:
        raise Exception(f"Error extracting text from PDF: {str(e)}")

def extract_text_from_file(content: bytes, filename: str) -> str:
    if filename.lower().endswith('.pdf'):
        return extract_text_from_pdf(content)
    elif filename.lower().endswith('.txt'):
        try:
            return content.decode('utf-8')
        except UnicodeDecodeError:
            # Try alternative encoding if UTF-8 fails
            return content.decode('latin-1')
    else:
        raise Exception("Unsupported file type. Only PDF and TXT files are supported.")

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

def get_relevant_chunks(document_id: int, query: str, limit: int = 3):
    # Get query embedding using LangChain
    query_embedding = embeddings.embed_query(query)
    
    # Convert embedding to string with proper format for PostgreSQL vector comparison
    embedding_str = '[' + ','.join(map(str, query_embedding)) + ']'
    
    # Get chunks using raw SQL for cosine distance
    chunks = DocumentChunk.objects.filter(document_id=document_id)\
        .annotate(
            similarity_score=RawSQL(
                f"1 - (embedding::vector <=> '{embedding_str}'::vector)", 
                []
            )
        )\
        .order_by('-similarity_score')[:limit]
    
    # Set relevance field from similarity score
    for chunk in chunks:
        chunk.relevance = float(chunk.similarity_score)
    
    return chunks

def get_chat_response(query: str, relevant_chunks: List[DocumentChunk]) -> str:
    if relevant_chunks:
        context = "\n\n".join([chunk.content for chunk in relevant_chunks])
        
        # Create LangChain prompt template
        system_template = "You are a helpful assistant that answers questions based on document content. Be concise and accurate."
        human_template = """Based on the following context from the document:

{context}

Answer this question: {query}

If the answer cannot be derived from the context, say so."""
    else:
        system_template = "You are a helpful assistant that answers questions based on document content. Be concise and accurate."
        human_template = """The question is: {query}

I could not find relevant information in the document to answer this question. 
Please let me know that you cannot answer based on the document content, but provide a general response if possible."""

    try:
        # Create messages
        system_message_prompt = SystemMessagePromptTemplate.from_template(system_template)
        human_message_prompt = HumanMessagePromptTemplate.from_template(human_template)
        
        # Create chat prompt
        chat_prompt = ChatPromptTemplate.from_messages([
            system_message_prompt,
            human_message_prompt
        ])
        
        # Format prompt with variables
        messages = chat_prompt.format_prompt(
            context=context if relevant_chunks else "",
            query=query
        ).to_messages()
        
        # Get response from LLM
        response = llm(messages)
        return response.content
        
    except Exception as e:
        return f"Sorry, I encountered an error: {str(e)}" 
