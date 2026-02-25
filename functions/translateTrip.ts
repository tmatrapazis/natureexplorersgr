import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const { title, description, departure_from, requirements } = await req.json();

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

        return Response.json({ translatedData });
    } catch (error) {
        console.error("Error in translateTrip function:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});