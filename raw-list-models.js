async function listModels() {
    const apiKey = "AIzaSyA1n3sR5zH5xxzZolsmgkcCl2XFLw-F-TY";
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.models) {
            console.log("Supported Models:");
            data.models.forEach(m => console.log(`- ${m.name}`));
        } else {
            console.log("No models found or error:", data);
        }
    } catch (error) {
        console.error("Fetch error:", error);
    }
}

listModels();
