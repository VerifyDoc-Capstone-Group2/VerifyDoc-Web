async function UnderReview() {
  try {
    const response = await fetch("https://verifydoc-api-v1.onrender.com/");

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    // 3. Parse the data as JSON
    const data = await response.json();
    console.log(data);
  } catch (error) {
    // Handle network errors or issues parsing the JSON
    console.error("Fetch error:", error);
  }
}

fetchData();
