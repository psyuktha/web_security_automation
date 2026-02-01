#!/usr/bin/env python3
"""Script to list available Google AI models and their supported methods."""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def list_models_ai_studio():
    """List models using Google AI Studio API."""
    try:
        from google.genai import Client
        
        api_key = os.environ.get("GOOGLE_API_KEY")
        if not api_key:
            print("Error: GOOGLE_API_KEY not found in environment variables.")
            return False
        
        client = Client(api_key=api_key)
        
        print("=" * 80)
        print("Available Models (Google AI Studio)")
        print("=" * 80)
        
        models = client.models.list()
        
        for model in models:
            print(f"\nModel: {model.name}")
            print(f"  Display Name: {getattr(model, 'display_name', 'N/A')}")
            print(f"  Description: {getattr(model, 'description', 'N/A')}")
            print(f"  Supported Methods: {getattr(model, 'supported_generation_methods', 'N/A')}")
            print(f"  Input Token Limit: {getattr(model, 'input_token_limit', 'N/A')}")
            print(f"  Output Token Limit: {getattr(model, 'output_token_limit', 'N/A')}")
            if hasattr(model, 'version'):
                print(f"  Version: {model.version}")
        
        return True
    except ImportError:
        print("Error: google-genai library not installed.")
        print("Install it with: pip install google-genai")
        return False
    except Exception as e:
        print(f"Error listing models: {e}")
        return False


def list_models_vertex_ai():
    """List models using Vertex AI API."""
    try:
        import vertexai
        from vertexai.preview.generative_models import GenerativeModel
        
        project = os.environ.get("GOOGLE_CLOUD_PROJECT")
        location = os.environ.get("GOOGLE_CLOUD_LOCATION", "us-central1")
        
        if not project:
            print("Error: GOOGLE_CLOUD_PROJECT not found in environment variables.")
            return False
        
        vertexai.init(project=project, location=location)
        
        print("=" * 80)
        print(f"Available Models (Vertex AI - Project: {project}, Location: {location})")
        print("=" * 80)
        
        # Common Gemini models to check
        common_models = [
            "gemini-1.5-flash",
            "gemini-1.5-pro",
            "gemini-2.0-flash-exp",
            "gemini-2.5-flash",
            "gemini-2.5-pro",
        ]
        
        print("\nCommon Gemini Models:")
        for model_name in common_models:
            try:
                model = GenerativeModel(model_name)
                print(f"  ✓ {model_name} - Available")
            except Exception as e:
                print(f"  ✗ {model_name} - Not available: {str(e)[:50]}")
        
        # Try to get model info using the API
        try:
            from google.cloud import aiplatform
            client = aiplatform.gapic.ModelServiceClient()
            parent = f"projects/{project}/locations/{location}"
            
            print("\n\nFetching models from Vertex AI...")
            # Note: This might require specific permissions
            print("Note: Full model listing may require additional API calls.")
            
        except Exception as e:
            print(f"Note: Could not fetch full model list: {e}")
        
        return True
    except ImportError:
        print("Error: google-cloud-aiplatform library not installed.")
        print("Install it with: pip install google-cloud-aiplatform")
        return False
    except Exception as e:
        print(f"Error listing models: {e}")
        return False


def main():
    """Main function to list models."""
    use_vertex = os.environ.get("GOOGLE_GENAI_USE_VERTEXAI", "0").lower() in ("1", "true", "yes")
    
    print("\n" + "=" * 80)
    print("Google AI Models Listing")
    print("=" * 80)
    print(f"Configuration: {'Vertex AI' if use_vertex else 'Google AI Studio'}")
    print("=" * 80 + "\n")
    
    if use_vertex:
        success = list_models_vertex_ai()
    else:
        success = list_models_ai_studio()
    
    if not success:
        print("\n" + "=" * 80)
        print("Trying alternative method...")
        print("=" * 80 + "\n")
        
        if use_vertex:
            list_models_ai_studio()
        else:
            list_models_vertex_ai()
    
    print("\n" + "=" * 80)
    print("Model Listing Complete")
    print("=" * 80)


if __name__ == "__main__":
    main()

