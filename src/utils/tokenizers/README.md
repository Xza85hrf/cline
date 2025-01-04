# DeepSeek Offline Tokenizer

This implementation provides offline token counting capabilities for the DeepSeek API, allowing for accurate token usage calculation without making API requests.

## Requirements

- Python 3.x
- `transformers` library from Hugging Face

## Installation

1. Install Python dependencies:

```bash
pip install transformers
```

2. The tokenizer files are located in `assets/deepseek_v2_tokenizer/deepseek_v2_tokenizer/`:
   - `tokenizer.json`: The main tokenizer configuration
   - `tokenizer_config.json`: Additional tokenizer settings

## Usage

The tokenizer is automatically used by the DeepSeek provider to:

- Calculate input token usage before making API requests
- Track output token usage during streaming responses

### Implementation Details

- `deepseek_tokenizer.py`: Python script that interfaces with the Hugging Face tokenizer
- `deepseek.ts`: TypeScript module that manages the Python process and provides token counting APIs

The implementation handles:

- Automatic Python environment detection
- Proper process management and cleanup
- Error handling and reporting
- Token counting for both text and structured message formats

### Token Calculation

The tokenizer calculates tokens for:

- System prompts
- User messages
- Assistant responses
- Structured content (arrays of text blocks)

## Error Handling

The implementation includes robust error handling for common scenarios:

- Python environment not found
- Tokenizer initialization failures
- Process communication errors
- Invalid input formats

Even if token calculation fails, the API requests will still proceed, ensuring the application remains functional.
