#!/usr/bin/env python3
import sys
import json
import os
import transformers


def get_tokenizer():
    # Get the directory containing this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    # Path to tokenizer files
    tokenizer_dir = os.path.join(
        script_dir,
        "../../../assets/deepseek_v2_tokenizer/deepseek_v2_tokenizer"
    )

    tokenizer = transformers.AutoTokenizer.from_pretrained(
        tokenizer_dir, trust_remote_code=True
    )
    return tokenizer


def count_tokens(text):
    try:
        tokenizer = get_tokenizer()
        tokens = tokenizer.encode(text)
        return len(tokens)
    except Exception as e:
        return json.dumps({"error": str(e)})


if __name__ == "__main__":
    # Read input from stdin
    input_text = sys.stdin.read()

    try:
        # Parse input as JSON
        data = json.loads(input_text)
        text = data.get("text", "")

        # Count tokens
        token_count = count_tokens(text)

        # Return result as JSON
        print(json.dumps({"count": token_count}))
    except json.JSONDecodeError as e:
        print(json.dumps({"error": f"Invalid JSON input: {str(e)}"}))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
