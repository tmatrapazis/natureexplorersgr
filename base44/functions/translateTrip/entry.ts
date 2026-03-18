import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const raw = await req.json();
        const body = raw.payload || raw;

        // Bulk title translation mode
        if (body.titles) {
            const { titles } = body;
            if (!titles || titles.length === 0) {
                return Response.json({ error: "Titles array is required and must not be empty" }, { status: 400 });
            }

            const prompt = `Translate the following Greek hiking trip titles to English. Return ONLY a JSON array with the same ids and translated titles.

Titles to translate:
${JSON.stringify(titles)}

Return format:
{
  "translatedTitles": [{"id": "...", "title": "translated title"}, ...]
}`;

            try {
                const result = await base44.integrations.Core.InvokeLLM({
                    prompt,
                    response_json_schema: {
                        type: "object",
                        properties: {
                            translatedTitles: {
                                type: "array",
                                items: {
                                    type: "object",
                                    properties: {
                                        id: { type: "string" },
                                        title: { type: "string" }
                                    }
                                }
                            }
                        },
                        required: ["translatedTitles"]
                    },
                    add_context_from_internet: false
                });

                if (!result || !result.translatedTitles) {
                    return Response.json({ error: "Invalid LLM response: missing translatedTitles" }, { status: 500 });
                }

                return Response.json(result);
            } catch (llmError) {
                console.error("LLM bulk translation error:", llmError);
                return Response.json({ 
                    error: "Translation failed: " + (llmError.message || "Unknown LLM error") 
                }, { status: 500 });
            }
        }

        // Single trip full translation mode
        const { title, description, departure_from, requirements } = body;

        if (!title) {
            return Response.json({ error: "Title is required" }, { status: 400 });
        }

        const prompt = `Translate the following Greek hiking trip information to English. Return ONLY a JSON object with the translated fields, no additional text or explanation.

Fields to translate:
- title: "${title}"
- description: "${description || ''}"
- departure_from: ${JSON.stringify(departure_from || [])}
- requirements: ${JSON.stringify(requirements || [])}

Return format:
{
  "title": "translated title",
  "description": "translated description",
  "departure_from": ["translated location 1", "translated location 2"],
  "requirements": ["translated requirement 1", "translated requirement 2"]
}`;

        try {
            const translatedData = await base44.integrations.Core.InvokeLLM({
                prompt: prompt,
                response_json_schema: {
                    type: "object",
                    properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        departure_from: { 
                            type: "array",
                            items: { type: "string" }
                        },
                        requirements: { 
                            type: "array",
                            items: { type: "string" }
                        }
                    },
                    required: ["title"]
                },
                add_context_from_internet: false
            });

            if (!translatedData || !translatedData.title) {
                return Response.json({ error: "Invalid LLM response: missing title" }, { status: 500 });
            }

            return Response.json({ translatedData });
        } catch (llmError) {
            console.error("LLM single trip translation error:", llmError);
            return Response.json({ 
                error: "Single trip translation failed: " + (llmError.message || "Unknown LLM error") 
            }, { status: 500 });
        }
    } catch (error) {
        console.error("Error in translateTrip function:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});