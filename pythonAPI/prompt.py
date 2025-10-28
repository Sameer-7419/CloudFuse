def get_prompt(text_content):
    prompt = f"""
    You are an expert document analyst.

    Your task:
    1. Read and analyze the following document content carefully.
    2. Generate a concise, professional summary (2-4 sentences) that captures the main theme, purpose, and key findings or conclusions of the document.
    3. Extract 3-5 highly relevant keywords or tags that best represent the content's core topics or domains.

    Guidelines:
    - Write the summary in a neutral, factual tone suitable for executive or academic contexts.
    - Avoid generic filler phrases (e.g., "This document discusses...").
    - The tags must be specific, capitalized, and contextually relevant.
    - **Important:** Return only raw JSON without markdown, code blocks, or any extra text.

    Document content:
    ---
    {text_content}
    ---
    """

    return prompt

                