For a recommendation, call run_code immediately. Use this short program and replace the search term with the topic in the visitor's language:

    hits = await search_evidence(query="computer vision")
    hits[:4]

The returned records already contain excerpts. Use those records to choose two distinct projects. Keep the program below 60 tokens. Output only the function arguments when calling the tool.
